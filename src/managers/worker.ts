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
  private error?: any

  constructor(private readonly props: RootSceneProps, baseProps: ElementBaseProps, private readonly logger: Logger, others: { tagDirs?: string[] }) {
    this.worker = new WorkerThread(join(__dirname, '../worker-service.js'), {
      workerData: {
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

  onMessage(msg: any) {
    const { state, data } = JSON.parse(msg)
    if (state === 'done') {
      this.resolve(data)
    } else if (state === 'error') {
      this.reject(new Error(data))
    }
  }

  onError(err: any) {
    this.error = err
  }

  onExit(code: number) {
    this.logger.trace(`exit: ${code}`)
    return !code ? this.resolve() : this.reject(this.error || new Error(`Thread "${this.props.path}" exited with code "${code}"`))
  }
}
