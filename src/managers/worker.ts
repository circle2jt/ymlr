import { join } from 'path'
import { ElementBaseProps } from 'src/components/element.interface'
import { RootSceneProps } from 'src/components/root-scene.props'
import { Logger } from 'src/libs/logger'
import { Worker as WorkerThread } from 'worker_threads'

export class Worker {
  private readonly worker: WorkerThread
  private resolve!: Function
  private reject!: Function
  private proms?: Promise<any>

  constructor(private readonly props: RootSceneProps, baseProps: ElementBaseProps, private readonly logger: Logger) {
    this.worker = new WorkerThread(join(__dirname, '../worker-service.js'), {
      workerData: {
        baseProps,
        props
      },
      env: process.env
    })
    this.worker.on('message', this.onMessage.bind(this))
    this.worker.on('error', this.onError.bind(this))
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
    }
  }

  onMessage(msg: any) {
    this.logger.trace('message: %s', msg.toString())
  }

  onError(err: any) {
    this.logger.error('error: %o', err)
  }

  onExit(code: number) {
    this.logger.trace(`exit: ${code}`)
    return !code ? this.resolve() : this.reject(new Error(`Thread "${this.props.path}" exited with code "${code}"`))
  }
}
