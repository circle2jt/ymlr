import { parentPort, workerData } from 'worker_threads'
import { App } from './app'
import { LoggerFactory } from './libs/logger/logger-factory'

void (async () => {
  try {
    const { baseProps = {}, props = {}, tagDirs, templates, id, loggerDebugContexts, loggerDebug, loggerConfig } = workerData
    LoggerFactory.DEBUG = loggerDebug
    LoggerFactory.DEBUG_CONTEXTS = loggerDebugContexts
    LoggerFactory.DEFAULT_LOGGER_CONFIG = loggerConfig
    LoggerFactory.PROCESS_ID = `#${id}`
    LoggerFactory.Configure(LoggerFactory.DEFAULT_LOGGER_CONFIG?.name, LoggerFactory.DEFAULT_LOGGER_CONFIG?.opts)
    LoggerFactory.LoadFromEnv()
    const appLogger = LoggerFactory.NewLogger(baseProps.debug || LoggerFactory.DEBUG)
    const app = new App(appLogger, props)
    if (tagDirs?.length) app.setDirTags(tagDirs)
    if (templates) app.setTemplates(templates)
    await app.exec()
    parentPort?.postMessage(JSON.stringify({ state: 'done' }))
  } catch (err: any) {
    parentPort?.postMessage(JSON.stringify({ state: 'error', data: err.message }))
  }
})()
