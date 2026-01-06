import assert from 'assert'
import { tmpdir } from 'os'
import { join } from 'path'
import { FileStorage } from 'src/libs/storage/file-storage'
import { MemStorage } from 'src/libs/storage/mem-storage'
import { type StorageInterface } from 'src/libs/storage/storage.interface'
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
        queueData:              # Pass input data to queue to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }
        - echo: ${ $parentState.queueData.dataFromParentState }

        - echo: ${ $ps.queueData }    # Queue data
        - echo: ${ $ps.queueInStore } # Describe this job queue is loaded from store, not added later
        - echo: ${ $ps.queueIndex }   # Queue index. Start from 0, reload when restart
        - echo: ${ $ps.queueCount }   # Count of queue which not done
        - echo: ${ $ps.queueName }    # Queue name

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
const QUEUE_REMOVED = Symbol('QUEUE_REMOVED')

export class FNQueue implements Element {
  static readonly Caches = new Map<string, FNQueue>()
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  get logger() {
    return this.proxy.logger
  }

  name!: string
  startup = true
  concurrent = 1
  skipError = false
  queueData: any
  db!: {
    path: string
    password?: string
  }

  queue = new Array<any>()

  private taskCount = 0
  private taskIndex = -1
  private store!: StorageInterface
  private isStoped?: boolean
  private t?: Promise<any>
  private resolve?: any
  private initJobCountInStore = 0

  get availQueue() {
    return this.queue.filter(data => data !== QUEUE_REMOVED)
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
          this.db.path = join(tmpdir(), this.name)
        }
        this.store = new FileStorage(this.logger, this.db.path, this.db.password)
      } else {
        this.store = new MemStorage(this.logger)
      }
      this.load()
      if (this.startup) {
        this.start()
        this.push(this.queueData)
      }
    } else {
      existed.push(this.queueData)
    }
  }

  push(queueData: any) {
    if (queueData === null) return
    this.logger.debug('Add a job in queue "%s"\t%j', this.name, queueData)
    this.queue.push(queueData)
    this.save()
    if (this.isStoped === false) {
      this.run()
    }
  }

  run() {
    while (this.isStoped === false && this.taskCount < this.concurrent && this.taskIndex < this.queue.length - 1) {
      if (!this.t) {
        this.t = new Promise((resolve) => {
          this.resolve = resolve
        })
      }
      ++this.taskCount
      ++this.taskIndex
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setImmediate(async (queueData, queueIndex) => {
        this.logger.debug('Run a job in queue "%s"\t%j', this.name, queueData)
        let isStop = false
        try {
          await this.innerRunsProxy.exec({
            queueName: this.name,
            queueData,
            queueIndex,
            queueCount: this.availQueue.length,
            queueInStore: queueIndex < this.initJobCountInStore
          })
        } catch (err: any) {
          err.queueData = queueData
          this.logger.error('Job in queue "%s" error', this.name, err)
          if (!this.skipError) {
            this.queue.push(queueData)
            isStop = true
          }
        } finally {
          this.queue[queueIndex] = QUEUE_REMOVED
          this.save()
          --this.taskCount

          if (isStop) {
            // Job error then force stop queue
            this.resolve()
            this.t = undefined
            await this.stop()
          } else if (this.taskCount === 0 && this.availQueue.length === 0) {
            // All job in queue done
            this.resolve()
            this.t = undefined
          } else {
            // Job done then there are some waiting jobs in the queue
            this.run()
          }
        }
      }, this.queue[this.taskIndex], this.taskIndex)
    }
  }

  private load() {
    this.logger.debug('Load queue jobs ' + this.name)
    this.queue = this.store.load([])
    this.taskIndex = -1
    this.taskCount = 0
    this.isStoped = undefined
    this.t = undefined
    this.initJobCountInStore = this.queue.length
  }

  start() {
    this.logger.debug('Start queue ' + this.name)
    this.isStoped = false
    this.run()
  }

  filter(filter: (queue: any) => boolean) {
    this.queue = this.queue.map(queue => {
      if (QUEUE_REMOVED === queue || !filter(queue)) {
        return QUEUE_REMOVED
      }
      return queue
    })
  }

  async stop() {
    this.logger.debug('Stoped queue ' + this.name)
    this.isStoped = true
    await this.t
    this.queue = []
    this.t = undefined
  }

  async remove() {
    this.logger.debug('Removed queue ' + this.name)
    await this.stop()
    this.store.clean()
    FNQueue.Caches.delete(this.name)
  }

  async dispose() {
    // this.stop()
    // this.logger.debug('Removed the queue "%s"', this.name)
    // FNQueue.Caches.delete(this.name)
  }

  private save() {
    this.logger.debug('Saved queue ' + this.name)
    this.store.save(this.availQueue)
  }
}
