import { type Indent } from './indent'
import { type Level } from './level'
import { LevelNumber } from './level-number'
import { LoggerLevel } from './logger-level'

export class LoggerFactory {
  static PROCESS_ID = '0'

  static DEBUG?: LoggerLevel
  static DEBUG_CONTEXTS?: Record<string, LoggerLevel>

  static DEFAULT_LOGGER: any

  static LoadFromEnv() {
    const DEBUG = process.env.DEBUG as LoggerLevel | undefined | 'true'
    // Validate --debug
    if (DEBUG === 'true') {
      LoggerFactory.DEBUG = LoggerLevel.DEBUG
    } else if (DEBUG) {
      if (!LevelNumber[DEBUG]) {
        console.warn(`--debug "${DEBUG}", Log level is not valid`)
      } else {
        LoggerFactory.DEBUG = DEBUG
      }
    }
    // Validate --debug-context
    const globalDebugContext: string[] | undefined = process.env.DEBUG_CONTEXTS?.split(',').map(e => e.trim())
    const debugCtx = globalDebugContext?.filter((keyValue: string) => keyValue.includes('='))
      .reduce((sum: Record<string, LoggerLevel>, keyValue: string) => {
        const idx = keyValue.indexOf('=')
        const key = keyValue.substring(0, idx)
        const vl = keyValue.substring(idx + 1) as LoggerLevel
        if (!LevelNumber[vl]) {
          console.warn(`--debug-context "${key}=${vl}", Log level is not valid`)
        } else {
          sum[key] = vl
        }
        return sum
      }, {})
    if (debugCtx && Object.keys(debugCtx).length > 0) LoggerFactory.DEBUG_CONTEXTS = debugCtx
  }

  static Dispose() {
    // this.Event?.removeAllListeners()
    // this.Event = undefined
    LoggerFactory.DEFAULT_LOGGER?.Dispose?.()
  }

  static NewLogger(level: LoggerLevel | Level | undefined, context?: string, indent?: Indent) {
    if (!LoggerFactory.DEFAULT_LOGGER) {
      const { ConsoleLogger } = require('./console')
      LoggerFactory.DEFAULT_LOGGER = ConsoleLogger
    }
    const logger = new LoggerFactory.DEFAULT_LOGGER(level, context, indent)
    return logger
  }

  // static Event?: EventEmitter
  // static On(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => any) {
  //   if (!this.Event) this.Event = new EventEmitter().setMaxListeners(0)
  //   eventNames.forEach(eventName => this.Event?.on(eventName, cb))
  // }

  // static Off(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => any) {
  //   this.Event && eventNames.forEach(eventName => this.Event?.off(eventName, cb))
  // }
}
