import { ElementBaseProps } from 'src/components/element.interface'
import { RootSceneProps } from 'src/components/root-scene.props'
import { Logger } from 'src/libs/logger'
import { Worker } from './worker'

export class WorkerManager {
  workers = new Set<Worker>()
  constructor(private readonly logger: Logger) { }

  async exec() {
    const wks = Array.from(this.workers)
    await Promise.all(wks.map(async wk => {
      try {
        await wk.exec()
      } finally {
        await wk.dispose()
        this.workers.delete(wk)
      }
    }))
  }

  async dispose() {
    const wks = Array.from(this.workers)
    await Promise.all(wks.map(async wk => {
      await wk.dispose()
      this.workers.delete(wk)
    }))
  }

  createWorker(props: RootSceneProps, baseProps: ElementBaseProps, others: { id: string, tagDirs?: string[], templates?: Record<string, any> }) {
    const wk = new Worker(props, baseProps, this.logger.clone(`worker:${others.id}`), others)
    this.workers.add(wk)
    return wk
  }
}
