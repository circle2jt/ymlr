import assert from 'assert'
import { tmpdir } from 'os'
import { join } from 'path'
import { FileStorage } from 'src/libs/storage/file-storage'
import { MemStorage } from 'src/libs/storage/mem-storage'
import { type StorageInterface } from 'src/libs/storage/storage.interface'
import { setTimeout } from 'timers/promises'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-queue
  Register a queue job
  @order 6
  @example
  ```yaml
    - fn-queue:
        name: My Queue 1        # Use stateless queue, not reload after startup
        concurrent: 2
        startup: true           # Run ASAP
        queueData:              # Pass input data to queue to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }
        - echo: ${ $parentState.queueData.dataFromParentState }

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
  isLoaded = false

  #taskCount = 0
  #store!: StorageInterface
  #isStoped = false
  #t?: Promise<any>
  #resolve?: any

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec() {
    assert(this.name)

    const existed = FNQueue.Caches.get(this.name)
    if (!existed) {
      FNQueue.Caches.set(this.name, this)
      this.load()
      if (this.startup) {
        this.push(this.queueData)
      }
      this.isLoaded = true
    } else {
      while (!existed.isLoaded) {
        await setTimeout(100)
      }
      existed.push(this.queueData)
    }
  }

  push(queueData: any) {
    this.logger.debug('Add a job in queue "%s"\t%j', this.name, queueData)
    this.queue.push(queueData)
    this.save()
    // eslint-disable-next-line
    setImmediate(async () => await this.run())
  }

  async run() {
    if (!this.#isStoped && this.#taskCount < this.concurrent && this.queue.length) {
      if (!this.#t) {
        this.#t = new Promise((resolve) => {
          this.#resolve = resolve
        })
      }
      ++this.#taskCount
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setImmediate(async (queueData, queueCount) => {
        this.logger.debug('Run a job in queue "%s"\t%j', this.name, queueData)
        let isStop = false
        try {
          await this.innerRunsProxy.exec({
            queueName: this.name,
            queueData,
            queueCount
          })
        } catch (err: any) {
          this.logger.error(err)
          if (!this.skipError) {
            this.queue.push(queueData)
            this.save()
            isStop = true
          }
        } finally {
          --this.#taskCount
          if (isStop) {
            this.#resolve()
            this.#t = undefined
            await this.stop()
          } else if (this.#taskCount === 0 && this.queue.length === 0) {
            this.#resolve()
            this.#t = undefined
          } else {
            await this.run()
          }
        }
      }, this.queue.shift(), this.queue.length)
      this.save()
    }
  }

  async stop() {
    this.logger.debug('Stoped queue ' + this.name)
    this.#isStoped = true
    await this.#t
    this.queue = []
    this.#t = undefined
  }

  async remove() {
    this.logger.debug('Removed queue ' + this.name)
    await this.stop()
    this.#store.clean()
    FNQueue.Caches.delete(this.name)
  }

  async dispose() {
    // this.stop()
    // this.logger.debug('Removed the queue "%s"', this.name)
    // FNQueue.Caches.delete(this.name)
  }

  private save() {
    this.logger.debug('Saved queue ' + this.name)
    this.#store.save(this.queue)
  }

  private load() {
    this.logger.debug('Loaded queue ' + this.name)
    if (this.db !== undefined) {
      if (this.db === null) {
        this.db = {
          path: ''
        }
      }
      if (!this.db.path) {
        this.db.path = join(tmpdir(), this.name)
      }
      this.#store = new FileStorage(this.logger, this.db.path, this.db.password)
    } else {
      this.#store = new MemStorage(this.logger)
    }
    this.queue = this.#store.load([])
  }
}
