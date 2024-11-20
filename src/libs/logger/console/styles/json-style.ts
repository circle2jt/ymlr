import { LevelFactory } from '../../level-factory'
import { LoggerLevel } from '../../logger-level'
import { type LogMetaData, type LogStyle } from './log-style'

export default class JsonStyle implements LogStyle {
  print(printToConsole: (...args: any[]) => any, meta: LogMetaData, msg: string | any, ...prms: any) {
    const threadID = meta.threadID
    const timestamp = meta.timestamp.getTime()
    const level = LevelFactory.GetInstance(meta.level).name
    const contextPath = meta.fullContextPath
    const result: Record<string, any> = { threadID, timestamp, level, contextPath }
    if (typeof msg === 'string') {
      if ([LoggerLevel.error, LoggerLevel.fatal].includes(meta.level)) {
        msg = new Error(msg)
      } else {
        result.msg = msg
      }
    }
    if (!result.msg) {
      const obj = msg
      if (obj instanceof Error) {
        const { name, message, cause, stack, ...more } = obj
        result.msg = message
        result.error = {
          name,
          message,
          cause: obj.cause,
          stack: obj.stack,
          ...more
        }
      } else {
        if (obj.msg) result.msg = obj.msg
      }
    }
    if (prms?.length) {
      result.prms = prms
    }
    printToConsole('%j', result)
  }
}
