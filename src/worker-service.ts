import { parentPort, workerData } from 'worker_threads'
import { App } from './app'
import { Logger } from './libs/logger'

void (async () => {
  try {
    const { baseProps = {}, props = {}, tagDirs, templates, id, loggerDebugContexts, loggerDebug } = workerData
    Logger.DEBUG = loggerDebug
    Logger.DEBUG_CONTEXTS = loggerDebugContexts
    Logger.PROCESS_ID = id
    Logger.LoadFromEnv()
    const appLogger = Logger.NewLogger(baseProps.debug || Logger.DEBUG)
    const app = new App(appLogger, props)
    if (tagDirs?.length) app.setDirTags(tagDirs)
    if (templates) app.setTemplates(templates)
    await app.exec()
    parentPort?.postMessage(JSON.stringify({ state: 'done' }))
  } catch (err: any) {
    parentPort?.postMessage(JSON.stringify({ state: 'error', data: err.message }))
  }
})()
