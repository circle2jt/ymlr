import { ElementBaseProps } from 'src/components/element.interface'
import { RootSceneProps } from 'src/components/root-scene.props'
import { Logger } from 'src/libs/logger'
import { Worker } from './worker'

export class WorkerManager {
  workers = new Set<Worker>()
  constructor(private readonly logger: Logger) { }

  async exec() {
    const wks = Array.from(this.workers)
    await Promise.all(wks.map(async wk => await wk.exec()))
  }

  async dispose() {
    const wks = Array.from(this.workers)
    await Promise.all(wks.map(async wk => {
      await wk.dispose()
      await wk.exec()
    }))
  }

  createWorker(props: RootSceneProps, baseProps: ElementBaseProps) {
    const wk = new Worker(props, baseProps, this.logger.clone(`worker:${baseProps.name}`))
    this.workers.add(wk)
    return wk
  }
}
