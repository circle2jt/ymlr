import { parentPort, workerData } from 'worker_threads'
import { App } from './app'
import { GlobalEvent } from './libs/global-event'
import { LoggerFactory } from './libs/logger/logger-factory'
import { Constants } from './managers/constants'

void (async () => {
  const { baseProps = {}, props = {}, tagDirs, templates, id } = workerData
  let allEventListener: any
  try {
    App.ThreadID = id
    LoggerFactory.LoadFromEnv()
    const appLogger = LoggerFactory.NewLogger(baseProps.debug || LoggerFactory.DEBUG?.level, undefined, baseProps.errorStack)
    allEventListener = (data: any, opts?: { toIDs?: string[] | string }) => {
      let toIDs: string[] | undefined
      if (opts?.toIDs !== undefined) {
        if (!Array.isArray(opts.toIDs)) {
          toIDs = [opts.toIDs]
        } else {
          toIDs = opts.toIDs
        }
      }
      appLogger.trace('<worker.event -> main> Transfer data from #%d to %j: %j', App.ThreadID, toIDs, data)
      parentPort?.postMessage({
        type: 'event',
        name: Constants.FROM_GLOBAL_EVENT,
        value: data,
        toIDs,
        fromID: App.ThreadID
      })
    }
    parentPort?.on('message', (data: any) => {
      const { type, name, value, fromID, toID } = data
      if (type === 'event') {
        appLogger.trace('<main -> worker.event> Emited data to "%d.%s": %s', App.ThreadID, name, value)
        GlobalEvent.emit(name, value, {
          fromID,
          toID
        })
      }
    })
    GlobalEvent.on(Constants.TO_GLOBAL_EVENT, allEventListener)
    const app = new App(appLogger, props)
    if (tagDirs?.length) app.setDirTags(tagDirs)
    if (templates) app.setTemplates(templates)
    await app.exec()
    parentPort?.postMessage({ type: 'signal' })
  } catch (err: any) {
    parentPort?.postMessage({ type: 'signal', error: err.message })
  } finally {
    GlobalEvent.off(Constants.TO_GLOBAL_EVENT, allEventListener)
  }
})()
