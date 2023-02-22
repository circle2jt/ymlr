import { workerData } from 'worker_threads'
import { App } from './app'
import { Logger, LoggerLevel } from './libs/logger'

void (async () => {
  const { baseProps = {}, props = {} } = workerData
  const globalDebug: LoggerLevel = (process.env.DEBUG as LoggerLevel) || baseProps.debug || LoggerLevel.INFO
  const appLogger = new Logger(globalDebug)
  Logger.globalName = baseProps.name
  const app = new App(appLogger, props)
  await app.exec()
})()
