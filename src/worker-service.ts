import { parentPort, workerData } from 'worker_threads'
import { App } from './app'
import { Logger } from './libs/logger'
import { LoggerLevel } from './libs/logger/logger-level'

void (async () => {
  try {
    const { baseProps = {}, props = {}, tagDirs, templates, id } = workerData
    const globalDebug: LoggerLevel = (process.env.DEBUG as LoggerLevel) || baseProps.debug || LoggerLevel.INFO
    const appLogger = new Logger(globalDebug)
    Logger.GlobalName = id
    const app = new App(appLogger, props)
    if (tagDirs?.length) app.setDirTags(tagDirs)
    if (templates) app.setTemplates(templates)
    await app.exec()
    parentPort?.postMessage(JSON.stringify({ state: 'done' }))
  } catch (err: any) {
    parentPort?.postMessage(JSON.stringify({ state: 'error', data: err.message }))
  }
})()
