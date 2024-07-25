import { join } from 'path'
import { type ElementBaseProps } from 'src/components/element.interface'
import { type RootSceneProps } from 'src/components/root-scene.props'
import { type Logger } from 'src/libs/logger'
import { type LoggerLevel } from 'src/libs/logger/logger-level'
import { Worker as WorkerThread } from 'worker_threads'
import { type WorkerManager } from './worker-manager'

export class Worker {
  private readonly worker: WorkerThread
  private resolve!: (data?: any) => void
  private reject!: (error: Error) => void
  private proms?: Promise<any>
  private error?: any

  constructor(
    private readonly workerManager: WorkerManager,
    public id: string,
    private readonly props: RootSceneProps,
    baseProps: ElementBaseProps,
    private readonly logger: Logger,
    others: {
      tagDirs?: string[]
      templates?: Record<string, any>
      loggerDebug?: LoggerLevel
      loggerConfig?: any
    }) {
    this.worker = new WorkerThread(join(__dirname, '../worker-service.js'), {
      workerData: {
        id: this.id,
        baseProps,
        props,
        ...others
      },
      env: process.env
    })
    this.worker.on('message', this.onMessage.bind(this))
    this.worker.on('error', this.onError.bind(this))
    this.worker.on('exit', this.onExit.bind(this))
  }

  emit(type: 'event', name: string | symbol, value: any, opts: { fromID: string, toID: string }) {
    this.logger.trace('<main.event -> worker> Emited data to "%d.%s": %j - %s', this.id, name, value, type)
    this.worker.postMessage({
      type,
      name,
      value,
      ...opts
    })
  }

  async exec() {
    if (!this.proms) {
      this.proms = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    }
    await this.proms
  }

  async dispose() {
    if (this.proms) {
      await this.worker.terminate()
      await this.proms
      this.proms = undefined
    }
  }

  onMessage(data: any) {
    const { name, type, value, error, toIDs, fromID } = data
    if (type === 'signal') {
      if (!error) {
        this.resolve(undefined)
      } else {
        this.reject(new Error(error))
      }
    } else if (type === 'event') {
      this.workerManager.broadcastEvent(name, value, fromID, toIDs)
    }
  }

  onError(err: any) {
    this.error = err
  }

  onExit(code: number) {
    this.logger.trace(`exit: ${code}`)
    !code ? this.resolve() : this.reject(this.error || new Error(`Thread "${this.props.path}" exited with code "${code}"`))
  }
}
