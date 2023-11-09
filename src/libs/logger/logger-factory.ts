import { Console } from 'console'
import { type Indent } from './indent'
import { GetLoggerLevel, LoggerLevel } from './logger-level'

export class LoggerFactory {
  static PROCESS_ID = '#0'

  static DEBUG?: LoggerLevel
  static DEBUG_CONTEXTS?: Record<string, LoggerLevel>

  static DEFAULT_LOGGER: any
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
    // Validate --debug-context
    const globalDebugContext: string[] | undefined = process.env.DEBUG_CONTEXTS?.split(',').map(e => e.trim())
    const debugCtx = globalDebugContext?.filter((keyValue: string) => keyValue.includes('='))
      .reduce((sum: Record<string, LoggerLevel>, keyValue: string) => {
        const idx = keyValue.indexOf('=')
        const key = keyValue.substring(0, idx)
        const vl = keyValue.substring(idx + 1)
        const llv = GetLoggerLevel(vl)
        if (!llv) {
          console.warn(`--debug-context "${key}=${vl}", Log level is not valid`)
        } else {
          sum[key] = llv
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

  static Configure(name = 'console' as 'console' | 'file' | 'event', opts = {} as any) {
    LoggerFactory.DEFAULT_LOGGER_CONFIG = {
      name,
      opts
    }
    if (name === 'file') {
      const { FileLogger } = require('./file')
      FileLogger.SetOutput(opts.stdout, opts.stderr)
      LoggerFactory.DEFAULT_LOGGER = FileLogger
    } else if (name === 'event') {
      const { EventLogger } = require('./event')
      EventLogger.SetOutput()
      LoggerFactory.DEFAULT_LOGGER = EventLogger
    } else {
      const { ConsoleLogger } = require('./console')
      ConsoleLogger.SetConsole(new Console({
        stdout: process.stdout,
        stderr: process.stderr,
        ...opts
      }))
      LoggerFactory.DEFAULT_LOGGER = ConsoleLogger
    }
  }

  static NewLogger(level: LoggerLevel | undefined, context?: string, indent?: Indent) {
    if (!LoggerFactory.DEFAULT_LOGGER) {
      this.Configure()
    }
    const logger = new LoggerFactory.DEFAULT_LOGGER(level, context, indent)
    return logger
  }
}
