import { type Indent } from '../../indent'
import { type LoggerLevel } from '../../logger-level'

export interface LogMetaData {
  threadID: string
  timestamp: Date
  level: LoggerLevel
  indent: Indent
  fullContextPath: string
}

export interface LogStyle {
  print: (printToConsole: (...args: any[]) => any, meta: LogMetaData, msg: string | any, ...prms: any) => void
}
