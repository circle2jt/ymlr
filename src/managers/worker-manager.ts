import { type ElementBaseProps } from 'src/components/element.interface'
import { type RootSceneProps } from 'src/components/root-scene.props'
import { type Logger } from 'src/libs/logger'
import { type LoggerLevel } from 'src/libs/logger/logger-level'
import { Worker } from './worker'

export class WorkerManager {
  readonly #workers = new Set<Worker>()

  constructor(private readonly logger: Logger) { }

  async exec() {
    const wks = Array.from(this.#workers)
    await Promise.all(wks.map(async wk => {
      try {
        await wk.exec()
      } finally {
        await wk.dispose()
        this.#workers.delete(wk)
      }
    }))
  }

  async dispose() {
    const wks = Array.from(this.#workers)
    await Promise.all(wks.map(async wk => {
      await wk.dispose()
      this.#workers.delete(wk)
    }))
  }

  createWorker(props: RootSceneProps, baseProps: ElementBaseProps, others: {
    id: string
    tagDirs?: string[]
    templates?: Map<string, any>
    loggerDebugContexts?: Record<string, LoggerLevel>
    loggerDebug?: LoggerLevel
  }) {
    const wk = new Worker(props, baseProps, this.logger.clone(`worker:${others.id}`), others)
    this.#workers.add(wk)
    return wk
  }
}
