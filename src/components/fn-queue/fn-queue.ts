import assert from 'assert'
import { FileTemp } from 'src/libs/file-temp'
import { type FileStorage } from 'src/libs/storage/file-storage'
import { type MemStorage } from 'src/libs/storage/mem-storage'
import { type StorageInterface } from 'src/libs/storage/storage.interface'
import { StoreFactory } from 'src/libs/storage/store-factory'
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
          dataFromParentState: ${ $ws().channelData.name }
      runs:
        - echo: ${ $ws().queueData.key1 } is ${ $ws().queueData.value1 }
        - echo: ${ $ws().queueData.dataFromParentState }

        - echo: ${ $ws().queueData }        # Queue data
        - echo: ${ $ws().queueErrorCount }  # Num of error when retry this job
        - echo: ${ $ws().queueCreatedAt }   # Time which a queue is created for the first time
        - echo: ${ $ws().queueCount }       # Count of queue which not done
        - echo: ${ $ws().queueName }        # Queue name

    - fn-queue:
        name: My Queue 1
        queueData:
          key1: value1
          key2: value 2
  ```
  File Store
  ```yaml
    - fn-queue:
        name: My Queue 1
        concurrent: 2
        skipError: false       # Not throw error when a job failed
        db:                    # Optional: Statefull queue, it's will reload after startup
          path: /tmp/db        #  - Optional: Default is "tempdir/queuename"
          password: abc        #  - Optional: Default is no encrypted by password
      runs:
        - echo: ${ $ws().queueData.key1 } is ${ $ws().queueData.value1 }

    - fn-queue:
        name: My Queue 1
        queueData:
          key1: value1
          key2: value 2
  ```
  External Store
  ```yaml
    - id: fileDataStore
      file'store:
        path: /tmp/data.json      # Path to store data
        password:                 # Password to encrypt/decrypt data content
        initData: []              # Default data will be stored when file not found

    - fn-queue:
        name: My Queue 1
        concurrent: 2
        skipError: false       # Not throw error when a job failed
        store: ${ $v.fileDataStore.$.store }
      runs:
        - echo: ${ $ws().queueData.key1 } is ${ $ws().queueData.value1 }

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

  store?: StorageInterface

  private _queue = new Array<QueueData>()
  private _taskCount = 0
  private _isStoped?: boolean
  private _t?: Promise<any>
  private _resolve?: any

  get availQueue() {
    this._queue = this._queue.filter(data => {
      if (!data.createdAt) return false
      if (!this.queueFilter.expiredJobAfter) return true
      return (Date.now() - data.createdAt <= this.queueFilter.expiredJobAfter) && this.queueFilter.filter?.(data) !== false
    })
    return this._queue
  }

  constructor(props: any) {
    globalThis.copyProps(this, props)
  }

  async exec() {
    assert(this.name?.length, 'name is required')

    const existed = FNQueue.Caches.get(this.name)
    if (!existed) {
      FNQueue.Caches.set(this.name, this)
      if (!this.store) {
        if (this.db !== undefined) {
          if (this.db === null) {
            this.db = {
              path: ''
            }
          }
          if (!this.db.path) {
            this.db.path = new FileTemp('-' + this.name).file
          }
          this.store = StoreFactory.Create<FileStorage>(this.logger, {
            type: 'file',
            file: this.db.path,
            pwd: this.db.password
          })
        } else {
          this.store = StoreFactory.Create<MemStorage>(this.logger)
        }
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
    this.logger.debug('Add a job in queue "%s"\t%j', this.name, queueData)
    this._queue.push({ queueData, createdAt: Date.now(), errorCount: 0 })
    this.save()
    if (this._isStoped === false) {
      this.run()
    }
  }

  run() {
    while (this._isStoped === false) {
      if (this._taskCount >= this.concurrent) {
        this.logger.debug('Concurent is full %d/%d', this._taskCount, this.concurrent)
        break
      }
      if (!this.availQueue.length) {
        this.logger.debug('Queue is empty, done all')
        if (this.autoRemove) {
          this.remove()
        }
        break
      }
      ++this._taskCount
      const queue = this.availQueue.shift()
      if (!queue) continue

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setImmediate(async (queue: QueueData) => {
        const queueData = queue.queueData
        this.logger.debug('Run a job in queue "%s"\t%j', this.name, queueData)
        let isStop = false
        try {
          const timeoutMS = this.timeout
          if (timeoutMS && timeoutMS > 0) {
            await timeout(this.innerRunsProxy.exec({
              queueName: this.name,
              queueData,
              queueCount: this.availQueue.length + this._taskCount,
              queueErrorCount: queue.errorCount,
              queueCreatedAt: queue.createdAt
            }), timeoutMS)
          } else {
            await this.innerRunsProxy.exec({
              queueName: this.name,
              queueData,
              queueCount: this.availQueue.length + this._taskCount,
              queueErrorCount: queue.errorCount,
              queueCreatedAt: queue.createdAt
            })
          }
        } catch (err: any) {
          ++queue.errorCount
          if (!this.skipError) {
            this.logger
              .error('Job in queue "%s" error, retry later', this.name, err)
            isStop = true
            this._queue.push(queue)
            this.save()
          } else {
            this.logger
              .warn('Job in queue "%s" error, skiped', this.name, err)
          }
        } finally {
          this.save()
          --this._taskCount
          if (isStop) {
            // Job error then force stop queue
            this.stop()
          } else {
            // Job done then there are some waiting jobs in the queue
            this.run()
          }
        }
      }, queue)
    }
  }

  private load() {
    this.logger.debug('Load queue jobs ' + this.name)
    this._queue = this.store?.load([]) || []
    this._taskCount = 0
    this._isStoped = undefined
    this._t = undefined
  }

  async start() {
    if (this._isStoped === false) return

    this._t = new Promise((resolve) => {
      this._resolve = resolve
    })
    this.logger.debug('Start queue ' + this.name)
    this._isStoped = false
    this.run()
    await this._t
  }

  filter(filter: (queue: any) => boolean) {
    this.queueFilter.filter = filter
  }

  stop() {
    if (this._isStoped) return
    this.logger.debug('Stoped queue ' + this.name)
    this._isStoped = true
  }

  remove() {
    if (!this._t) return
    this.logger.debug('Removed queue ' + this.name)
    FNQueue.Caches.delete(this.name)
    this.stop()
    this._queue = []
    this.store?.clean()
    this._resolve?.()
    this._t = undefined
  }

  async dispose() {
    this.logger.debug('Dispose the queue "%s"', this.name)
    await this.innerRunsProxy.dispose()
  }

  private save() {
    this.logger.debug('Saved queue ' + this.name)
    this.store?.save(this.availQueue)
  }
}
