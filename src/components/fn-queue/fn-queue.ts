import assert from 'assert'
import { FileTemp } from 'src/libs/file-temp'
import { FileStorage } from 'src/libs/storage/file-storage'
import { MemStorage } from 'src/libs/storage/mem-storage'
import { type StorageInterface } from 'src/libs/storage/storage.interface'
import { timeout } from 'src/libs/timeout'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-queue
  Register a queue job
  @order 6
  @example
  ```yaml
    - id: myQueue
      fn-queue:
        name: My Queue 1        # Use stateless queue, not reload after startup
        concurrent: 2
        startup: true           # Run ASAP. Default is true. If its false then it only declare job, not run yet, need call $v.myQueue.$.start() to manual start.
        timeout: 1000           # Timeout for each job. Default is 0 (no timeout)
        queueFilter:
          expiredJobAfter: 6000 # When jobs are pending after 6s, then auto be removed
        autoRemove: true        # Auto remove queue after finshed all of jobs. Default is false
        queueData:              # Pass input data to queue to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }
        - echo: ${ $parentState.queueData.dataFromParentState }

        - echo: ${ $ps.queueData }        # Queue data
        - echo: ${ $ps.queueErrorCount }  # Num of error when retry this job
        - echo: ${ $ps.queueCreatedAt }   # Time which a queue is created for the first time
        - echo: ${ $ps.queueCount }       # Count of #queue which not done
        - echo: ${ $ps.queueName }        # Queue name

    - fn-queue:
        name: My Queue 1
        queueData:
          key1: value1
          key2: value 2
  ```

  ```yaml
    - fn-queue:
        name: My Queue 1
        concurrent: 2
        skipError: false       # Not throw error when a job failed
        db:                    # Optional: Statefull queue, it's will reload after startup
          path: /tmp/db        #  - Optional: Default is "tempdir/queuename"
          password: abc        #  - Optional: Default is no encrypted by password
      runs:
        - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }

    - fn-queue:
        name: My Queue 1
        queueData:
          key1: value1
          key2: value 2
  ```
*/
interface QueueData { queueData: any, createdAt?: number, errorCount: number }

export class FNQueue implements Element {
  static readonly Caches = new Map<string, FNQueue>()
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>
  get logger() {
    return this.proxy.logger
  }

  overrideProxyProps() {
    return {
      detach: true
    }
  }

  name!: string
  startup = true
  concurrent = 1
  timeout?: number
  skipError = false
  autoRemove = false
  queueData: any
  queueFilter: {
    expiredJobAfter?: number
    filter?: (queueData: any) => boolean
  } = {}

  db!: {
    path: string
    password?: string
  }

  #queue = new Array<QueueData>()

  private taskCount = 0
  private store?: StorageInterface
  private isStoped?: boolean
  private t?: Promise<any>
  private resolve?: any

  get availQueue() {
    this.#queue = this.#queue.filter(data => {
      if (!data.createdAt) return false
      if (!this.queueFilter.expiredJobAfter) return true
      return (Date.now() - data.createdAt <= this.queueFilter.expiredJobAfter) && this.queueFilter.filter?.(data) !== false
    })
    return this.#queue
  }

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec() {
    assert(this.name?.length, 'name is required')

    const existed = FNQueue.Caches.get(this.name)
    if (!existed) {
      FNQueue.Caches.set(this.name, this)
      if (this.db !== undefined) {
        if (this.db === null) {
          this.db = {
            path: ''
          }
        }
        if (!this.db.path) {
          this.db.path = new FileTemp('-' + this.name).file
        }
        this.store = new FileStorage(this.logger, this.db.path, this.db.password)
      } else {
        this.store = new MemStorage(this.logger)
      }
      this.load()
      if (this.queueData !== undefined) this.push(this.queueData)
      if (this.startup) {
        await this.start()
      }
      return
    }
    if (this.queueData === undefined) {
      return
    }
    existed.push(this.queueData)
  }

  push(queueData: any) {
    this.logger.debug('Add a job in #queue "%s"\t%j', this.name, queueData)
    this.#queue.push({ queueData, createdAt: Date.now(), errorCount: 0 })
    this.save()
    if (this.isStoped === false) {
      this.run()
    }
  }

  run() {
    while (this.isStoped === false) {
      if (this.taskCount >= this.concurrent) {
        this.logger.debug('Concurent is full %d/%d', this.taskCount, this.concurrent)
        break
      }
      if (!this.availQueue.length) {
        this.logger.debug('Queue is empty, done all')
        if (this.autoRemove) {
          this.remove()
        }
        break
      }
      ++this.taskCount
      const queue = this.availQueue.shift()
      if (!queue) continue

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setImmediate(async (queue: QueueData) => {
        const queueData = queue.queueData
        this.logger.debug('Run a job in #queue "%s"\t%j', this.name, queueData)
        let isStop = false
        try {
          const timeoutMS = this.timeout
          if (timeoutMS && timeoutMS > 0) {
            await timeout(this.innerRunsProxy.exec({
              queueName: this.name,
              queueData,
              queueCount: this.availQueue.length + this.taskCount,
              queueErrorCount: queue.errorCount,
              queueCreatedAt: queue.createdAt
            }), timeoutMS)
          } else {
            await this.innerRunsProxy.exec({
              queueName: this.name,
              queueData,
              queueCount: this.availQueue.length + this.taskCount,
              queueErrorCount: queue.errorCount,
              queueCreatedAt: queue.createdAt
            })
          }
        } catch (err: any) {
          ++queue.errorCount
          if (!this.skipError) {
            this.logger
              .error('Job in #queue "%s" error, retry later', this.name, err)
            isStop = true
            this.#queue.push(queue)
            this.save()
          } else {
            this.logger
              .warn('Job in #queue "%s" error, skiped', this.name, err)
          }
        } finally {
          this.save()
          --this.taskCount
          if (isStop) {
            // Job error then force stop #queue
            this.stop()
          } else {
            // Job done then there are some waiting jobs in the #queue
            this.run()
          }
        }
      }, queue)
    }
  }

  private load() {
    this.logger.debug('Load #queue jobs ' + this.name)
    this.#queue = this.store?.load([]) || []
    this.taskCount = 0
    this.isStoped = undefined
    this.t = undefined
  }

  async start() {
    if (this.isStoped === false) return

    this.t = new Promise((resolve) => {
      this.resolve = resolve
    })
    this.logger.debug('Start #queue ' + this.name)
    this.isStoped = false
    this.run()
    await this.t
  }

  filter(filter: (queue: any) => boolean) {
    this.queueFilter.filter = filter
  }

  stop() {
    if (this.isStoped) return
    this.logger.debug('Stoped #queue ' + this.name)
    this.isStoped = true
  }

  remove() {
    if (!this.t) return
    this.logger.debug('Removed #queue ' + this.name)
    FNQueue.Caches.delete(this.name)
    this.stop()
    this.#queue = []
    this.store?.clean()
    this.resolve?.()
    this.t = undefined
  }

  async dispose() {
    this.logger.debug('Dispose the #queue "%s"', this.name)
    await this.innerRunsProxy.dispose()
  }

  private save() {
    this.logger.debug('Saved #queue ' + this.name)
    this.store?.save(this.availQueue)
  }
}
