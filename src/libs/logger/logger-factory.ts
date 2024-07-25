import { type ErrorStack } from 'src/libs/error-stack'
import { type Logger } from '.'
import { ConsoleLogger } from './console'
import { type Indent } from './indent'
import { GetLoggerLevel, LoggerLevel } from './logger-level'

export class LoggerFactory {
  static DEBUG?: LoggerLevel
  static DEFAULT_LOGGER_CONFIG: any

  static LoadFromEnv() {
    const DEBUG = process.env.DEBUG
    // Validate --debug
    if (DEBUG === 'true') {
      LoggerFactory.DEBUG = LoggerLevel.debug
    } else if (DEBUG) {
      const debug = GetLoggerLevel(DEBUG)
      if (!debug) {
        console.warn(`--debug "${DEBUG}", Log level is not valid`)
      } else {
        LoggerFactory.DEBUG = debug
      }
    }
  }

  static Dispose() {
    // this.Event?.removeAllListeners()
    // this.Event = undefined
    // LoggerFactory.DEFAULT_LOGGER?.Dispose?.()
  }

  static Configure(name: string, opts = {} as any) {
    LoggerFactory.DEFAULT_LOGGER_CONFIG = {
      name,
      opts
    }
  }

  static NewLogger(level: LoggerLevel | undefined, context?: string, errorStack?: ErrorStack, indent?: Indent) {
    const logger = new ConsoleLogger(level, context, errorStack, undefined, indent)
    return logger as Logger
  }

  // static Event?: EventEmitter
  // static On(eventNames: Array<LoggerLevel.warn | LoggerLevel.error | LoggerLevel.fatal>, cb: () => any) {
  //   if (!this.Event) this.Event = new EventEmitter().setMaxListeners(0)
  //   eventNames.forEach(eventName => this.Event?.on(eventName, cb))
  // }

  // static Off(eventNames: Array<LoggerLevel.warn | LoggerLevel.error | LoggerLevel.fatal>, cb: () => any) {
  //   this.Event && eventNames.forEach(eventName => this.Event?.off(eventName, cb))
  // }
}
