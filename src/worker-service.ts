import { parentPort, workerData } from 'worker_threads'
import { App } from './app'
import { Logger, LoggerLevel } from './libs/logger'

void (async () => {
  try {
    const { baseProps = {}, props = {}, tagDirs, templates, id } = workerData
    const globalDebug: LoggerLevel = (process.env.DEBUG as LoggerLevel) || baseProps.debug || LoggerLevel.INFO
    const appLogger = new Logger(globalDebug)
    Logger.globalName = id
    const app = new App(appLogger, props)
    if (tagDirs?.length) app.setDirTags(tagDirs)
    if (templates) app.setTemplates(templates)
    await app.exec()
    parentPort?.postMessage(JSON.stringify({ state: 'done' }))
  } catch (err: any) {
    parentPort?.postMessage(JSON.stringify({ state: 'error', data: err.message }))
  }
})()
