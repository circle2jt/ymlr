import { type ErrorStack } from 'src/libs/error-stack'
import { Indent } from './indent'
import { Level } from './level'
import { LevelFactory } from './level-factory'
import { LoggerFactory } from './logger-factory'
import { LoggerCoreLevel, LoggerLevel } from './logger-level'

export abstract class Logger {
  #level!: Level
  get level() {
    return this.#level
  }

  set level(level: Level) {
    this.#level = level
    const levelsDisable = new Array<string>()
    if (this.is(LoggerLevel.debug)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace])
    } else if (this.is(LoggerLevel.info)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace], LoggerLevel[LoggerLevel.debug])
    } else if (this.is(LoggerLevel.warn)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace], LoggerLevel[LoggerLevel.debug], LoggerLevel[LoggerLevel.info], LoggerLevel[LoggerLevel.pass])
    } else if (this.is(LoggerLevel.error)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace], LoggerLevel[LoggerLevel.debug], LoggerLevel[LoggerLevel.info], LoggerLevel[LoggerLevel.pass], LoggerLevel[LoggerLevel.warn])
    } else if (this.is(LoggerLevel.fatal)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace], LoggerLevel[LoggerLevel.debug], LoggerLevel[LoggerLevel.info], LoggerLevel[LoggerLevel.pass], LoggerLevel[LoggerLevel.warn], LoggerLevel[LoggerLevel.error], LoggerLevel[LoggerLevel.fail])
    } else if (this.is(LoggerLevel.silent)) {
      levelsDisable.push(LoggerLevel[LoggerLevel.trace], LoggerLevel[LoggerLevel.debug], LoggerLevel[LoggerLevel.info], LoggerLevel[LoggerLevel.pass], LoggerLevel[LoggerLevel.warn], LoggerLevel[LoggerLevel.error], LoggerLevel[LoggerLevel.fail], LoggerLevel[LoggerLevel.fatal])
    }
    Object.keys(LoggerCoreLevel)
      .forEach(level => {
        if (levelsDisable.includes(level)) {
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
