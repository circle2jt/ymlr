import { Indent } from './indent'
import { type Level } from './level'
import { LevelFactory } from './level-factory'
import { LevelNumber } from './level-number'
import { LoggerLevel } from './logger-level'

export abstract class Logger {
  static PROCESS_ID = '0'

  static DEBUG?: LoggerLevel
  static DEBUG_CONTEXTS?: Record<string, LoggerLevel>

  static DEFAULT_LOGGER: any

  // static Event?: EventEmitter
  // static On(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => any) {
  //   if (!this.Event) this.Event = new EventEmitter().setMaxListeners(0)
  //   eventNames.forEach(eventName => this.Event?.on(eventName, cb))
  // }

  // static Off(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => any) {
  //   this.Event && eventNames.forEach(eventName => this.Event?.off(eventName, cb))
  // }

  static LoadFromEnv() {
    const DEBUG = process.env.DEBUG as LoggerLevel | undefined | 'true'
    // Validate --debug
    if (DEBUG === 'true') {
      Logger.DEBUG = LoggerLevel.DEBUG
    } else if (DEBUG) {
      if (!LevelNumber[DEBUG]) {
        console.warn(`--debug "${DEBUG}", Log level is not valid`)
      } else {
        Logger.DEBUG = DEBUG
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
    if (debugCtx && Object.keys(debugCtx).length > 0) Logger.DEBUG_CONTEXTS = debugCtx
  }

  static Dispose() {
    // this.Event?.removeAllListeners()
    // this.Event = undefined
    Logger.DEFAULT_LOGGER?.Dispose?.()
  }

  static NewLogger(level: LoggerLevel | Level | undefined, context?: string, indent?: Indent) {
    if (!Logger.DEFAULT_LOGGER) {
      const { ConsoleLogger } = require('./console')
      Logger.DEFAULT_LOGGER = ConsoleLogger
    }
    const logger = new Logger.DEFAULT_LOGGER(level, context, indent)
    return logger
  }

  public level?: Level
  public get levelName(): LoggerLevel | undefined {
    return LevelFactory.GetNameFromInstance(this.level)
  }

  set context(ctx: string) {
    this._context = ctx
  }

  get context() {
    return this._context
  }

  constructor(level?: LoggerLevel | Level | undefined, protected _context = '', public indent = new Indent()) {
    if (Logger.DEBUG_CONTEXTS?.[this.context]) {
      this.level = LevelFactory.GetInstance(LevelNumber[Logger.DEBUG_CONTEXTS[this.context]])
    } else {
      if (typeof level === 'string') {
        this.setLevelFromName(level)
      } else {
        this.level = level
      }
    }
    if (this.level === undefined && Logger.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[Logger.DEBUG])
    }
  }

  abstract log(...args: any[]): this
  abstract trace(...args: any[]): this
  abstract debug(...args: any[]): this
  abstract info(...args: any[]): this
  abstract warn(...args: any[]): this
  abstract error(...args: any[]): this
  abstract fatal(...args: any[]): this
  abstract clone(context?: string | undefined, level?: Level | LoggerLevel | undefined): Logger

  is(levelName: LoggerLevel) {
    return this.level?.is(LevelNumber[levelName])
  }

  addIndent(indent = 1) {
    this.indent.add(indent)
  }

  removeIndent(indent = 1) {
    this.indent.add(indent * -1)
  }

  setLevelFromName(level: LoggerLevel) {
    if (!Logger.DEBUG_CONTEXTS?.[this.context] && !Logger.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[level])
    }
  }
}
