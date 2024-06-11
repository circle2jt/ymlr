import assert from 'assert'
import { tmpdir } from 'os'
import { join } from 'path'
import { FileStorage } from 'src/libs/storage/file-storage'
import { MemStorage } from 'src/libs/storage/mem-storage'
import { type StorageInterface } from 'src/libs/storage/storage.interface'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-queue
  Register a queue job
  @order 6
  @example
  ```yaml
    - fn-queue:
        name: My Queue 1        # Use stateless queue, not reload after startup
        concurrent: 2
      runs:
        - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }

    - fn-queue'add:
        name: My Queue 1
        data:
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

    - fn-queue'add:
        name: My Queue 1
        data:
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
  concurrent = 1
  skipError = false
  db!: {
    path: string
    password?: string
  }

  #parentState?: any
  #taskCount = 0
  #data = new Array<any>()
  #store!: StorageInterface
  #isStoped = false
  #resolve: any
  #reject: any
  #t?: Promise<any>

  get data() {
    return this.#data
  }

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec(parentState?: Record<string, any>) {
    assert(this.name)

    this.#parentState = parentState
    this.load()
    this.run()
    this.#t = new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
    await this.#t
  }

  push(data: any) {
    this.logger.debug('Add a job in queue "%s"\t%j', this.name, data)
    this.#data.push(data)
    this.save()
    this.run()
  }

  run() {
    let task: any
    while (!this.#isStoped && this.#taskCount < this.concurrent && (task = this.#data.shift())) {
      ++this.#taskCount
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async (task, that) => {
        this.logger.debug('Run a job in queue "%s"\t%j', this.name, task)
        try {
          const parentState = {
            ...this.#parentState,
            queueData: task,
            get queueCount() {
              return that.data.length
            }
          }
          await this.innerRunsProxy.exec(parentState)
          --this.#taskCount
          this.run()
        } catch (err: any) {
          if (!this.skipError) {
            this.#data.push(task)
            this.save()
            this.stop()
            this.#reject(err)
          } else {
            this.logger.error(err?.message)
            --this.#taskCount
            this.run()
          }
        }
      }, 0, task, this)
      this.save()
    }
  }

  stop() {
    this.#isStoped = true
  }

  async remove() {
    this.#store.clean()
    this.stop()
  }

  async dispose() {
    this.stop()
    this.logger.debug('Removed the queue "%s"', this.name)
    FNQueue.Caches.delete(this.name)
    this.#resolve()
    await this.#t
  }

  private save() {
    this.#store.save(this.#data)
  }

  private load() {
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
    this.#data = this.#store.load([])

    FNQueue.Caches.set(this.name, this)
  }
}
