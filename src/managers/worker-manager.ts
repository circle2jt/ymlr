import { App } from 'src/app'
import { type ElementBaseProps } from 'src/components/element.interface'
import { type RootSceneProps } from 'src/components/root-scene.props'
import { GlobalEvent } from 'src/libs/global-event'
import { type Logger } from 'src/libs/logger'
import { type LoggerLevel } from 'src/libs/logger/logger-level'
import { Constants } from './constants'
import { Worker } from './worker'

export class WorkerManager {
  readonly #workers = new Array<Worker>()

  #allEventListener = (data: any, opts?: { toIDs?: string | string[] }) => {
    let toIDs: string[] | undefined
    if (opts?.toIDs !== undefined) {
      if (!Array.isArray(opts.toIDs)) {
        toIDs = [opts.toIDs]
      } else {
        toIDs = opts.toIDs
      }
    }
    this.broadcastEvent(Constants.FROM_GLOBAL_EVENT, data, App.ThreadID, toIDs)
  }

  constructor(private readonly logger: Logger) {
    GlobalEvent.on(Constants.TO_GLOBAL_EVENT, this.#allEventListener)
  }

  async exec() {
    const wks = Array.from(this.#workers)
    await Promise.all(wks.map(async wk => {
      try {
        await wk.exec()
      } finally {
        await wk.dispose()
        this.#workers.splice(this.#workers.indexOf(wk), 1)
      }
    }))
  }

  async dispose() {
    GlobalEvent.off(Constants.TO_GLOBAL_EVENT, this.#allEventListener)
    const wks = Array.from(this.#workers)
    await Promise.all(wks.map(async wk => {
      await wk.dispose()
      this.#workers.splice(this.#workers.indexOf(wk), 1)
    }))
  }

  createWorker(props: RootSceneProps, baseProps: ElementBaseProps, others: {
    id?: string
    tagDirs?: string[]
    templates?: Map<string, any>
    loggerDebug?: LoggerLevel
    loggerConfig?: any
  }) {
    if (!others.id) {
      others.id = `#${this.#workers.length + 1}`
    }
    const wk = new Worker(this, others.id, props, baseProps, this.logger.clone(`worker:${others.id}`), others)
    this.#workers.push(wk)
    return wk
  }

  broadcastEvent(name: string | symbol, value: any, fromID: string, toIDs?: string[]) {
    if (!toIDs) {
      toIDs = [
        App.ThreadID,
        ...this.#workers.map(wk => wk.id)
      ]
    }
    toIDs
      .filter(workerID => workerID !== fromID)
      .forEach(workerID => {
        if (workerID === App.ThreadID) {
          this.logger.trace(`<worker -> main.event> Emited data "#${App.ThreadID}.%s": %j`, App.ThreadID, name, value)
          GlobalEvent.emit(name, value, {
            fromID,
            toID: workerID
          })
        } else {
          const worker = this.#workers.find(wk => wk.id === workerID)
          worker?.emit('event', name, value, {
            fromID,
            toID: workerID
          })
        }
      })
  }
}
