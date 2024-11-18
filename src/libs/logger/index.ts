import { type ErrorStack } from 'src/libs/error-stack'
import { Indent } from './indent'
import { Level } from './level'
import { LevelFactory } from './level-factory'
import { SecretLevel } from './level/secret-level'
import { LoggerFactory } from './logger-factory'
import { LoggerCoreLevel, LoggerLevel } from './logger-level'

export abstract class Logger {
  #level!: Level
  get level() {
    return this.#level
  }

  set level(level: Level) {
    this.#level = level
    const levelsDisable = new Set<string>()
    if (this.is(LoggerLevel.debug)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
    } else if (this.is(LoggerLevel.info)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
    } else if (this.is(LoggerLevel.warn)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
        .add(LoggerLevel[LoggerLevel.info])
        .add(LoggerLevel[LoggerLevel.pass])
    } else if (this.is(LoggerLevel.error)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
        .add(LoggerLevel[LoggerLevel.info])
        .add(LoggerLevel[LoggerLevel.pass])
        .add(LoggerLevel[LoggerLevel.warn])
    } else if (this.is(LoggerLevel.fatal)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
        .add(LoggerLevel[LoggerLevel.info])
        .add(LoggerLevel[LoggerLevel.pass])
        .add(LoggerLevel[LoggerLevel.warn])
        .add(LoggerLevel[LoggerLevel.error])
        .add(LoggerLevel[LoggerLevel.fail])
    } else if (this.is(LoggerLevel.secret)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
        .add(LoggerLevel[LoggerLevel.info])
        .add(LoggerLevel[LoggerLevel.pass])
        .add(LoggerLevel[LoggerLevel.warn])
        .add(LoggerLevel[LoggerLevel.error])
        .add(LoggerLevel[LoggerLevel.fail])
        .add(LoggerLevel[LoggerLevel.fatal])
    } else if (this.is(LoggerLevel.silent)) {
      levelsDisable
        .add(LoggerLevel[LoggerLevel.trace])
        .add(LoggerLevel[LoggerLevel.debug])
        .add(LoggerLevel[LoggerLevel.info])
        .add(LoggerLevel[LoggerLevel.pass])
        .add(LoggerLevel[LoggerLevel.warn])
        .add(LoggerLevel[LoggerLevel.error])
        .add(LoggerLevel[LoggerLevel.fail])
        .add(LoggerLevel[LoggerLevel.fatal])
    }
    if (!LoggerFactory.DEBUG_SECRET && !(this.level instanceof SecretLevel)) {
      levelsDisable.add(LoggerLevel[LoggerLevel.secret])
    }
    Object.keys(LoggerCoreLevel)
      .forEach(level => {
        if (levelsDisable.has(level)) {
          (this as any)[level] = this.silent
        } else if ((this as any)[level] === this.silent) {
          (this as any)[level] = this.constructor.prototype[level].bind(this)
        }
      })
  }

  public get levelName() {
    return this.level.name
  }

  #context = ''
  set context(ctx: string) {
    this.#context = ctx
    this.fullContextPath = (this.contextPath + '/' + this.context).replace(/\/@[^/]+/g, '')
  }

  get context() {
    return this.#context
  }

  #contextPath = ''
  set contextPath(ctx: string) {
    this.#contextPath = ctx
    this.fullContextPath = (this.contextPath + '/' + this.context).replace(/\/@[^/]+/g, '')
  }

  get contextPath() {
    return this.#contextPath
  }

  protected fullContextPath = ''

  errorStack?: ErrorStack

  constructor(level: LoggerLevel | Level = LoggerLevel.info, context = '', errorStack: ErrorStack | undefined, public indent = new Indent()) {
    if (context) this.context = context
    if (errorStack) this.errorStack = { ...errorStack }
    this.level = level instanceof Level ? level : LevelFactory.GetInstance(level)
    // Inject global check for performance
    if (LoggerFactory.DEBUG || LoggerFactory.DEBUG_CONTEXT_FILTER) {
      const is = this.is.bind(this)
      this.is = function (level: LoggerLevel) {
        if (LoggerFactory.DEBUG?.is(level) === true) return true
        if (LoggerFactory.DEBUG_CONTEXT_FILTER?.test(this.fullContextPath) === false) return false
        return is(level)
      }
    }
  }

  abstract trace(...args: any[]): this
  abstract debug(...args: any[]): this
  abstract info(...args: any[]): this
  abstract pass(...args: any[]): this
  abstract warn(...args: any[]): this
  abstract error(...args: any[]): this
  abstract fail(...args: any[]): this
  abstract fatal(...args: any[]): this
  abstract secret(...args: any[]): this
  abstract clone(context?: string | undefined, level?: LoggerLevel | undefined, errorStack?: ErrorStack): Logger

  is(level: LoggerLevel) {
    return this.level.is(level)
  }

  addIndent(indent = 1) {
    this.indent.add(indent)
  }

  removeIndent(indent = 1) {
    this.indent.add(indent * -1)
  }

  dispose() { }

  private silent(..._: any[]) {
    return this
  }
}
