import { type ErrorStack } from 'src/libs/error-stack'
import { Indent } from './indent'
import { Level } from './level'
import { LevelFactory } from './level-factory'
import { LoggerFactory } from './logger-factory'
import { type LoggerLevel } from './logger-level'

export abstract class Logger {
  static #ID = 0
  static GenID(parent = '') {
    return `${parent}${parent && '-'}${this.#ID++}`
  }

  public level?: Level | null
  public get levelName(): string | undefined {
    return this.level?.name
  }

  #context = ''
  set context(ctx: string) {
    this.#context = ctx
  }

  get context() {
    return this.#context
  }

  errorStack?: ErrorStack

  constructor(level: LoggerLevel | Level | undefined, context = '', errorStack: ErrorStack = {}, public id = Logger.GenID(), public indent = new Indent()) {
    if (context) {
      this.context = context
    }
    this.errorStack = { ...errorStack }
    if (LoggerFactory.DEBUG_CONTEXTS?.[this.context]) {
      this.level = LevelFactory.GetInstance(LoggerFactory.DEBUG_CONTEXTS[this.context])
    } else if (level) {
      if (level instanceof Level) {
        this.level = level
      } else {
        this.setLevel(level)
      }
    }
    if (this.level === undefined && LoggerFactory.DEBUG) {
      this.level = LevelFactory.GetInstance(LoggerFactory.DEBUG)
    }
  }

  abstract log(...args: any[]): this
  abstract trace(...args: any[]): this
  abstract debug(...args: any[]): this
  abstract info(...args: any[]): this
  abstract warn(...args: any[]): this
  abstract error(...args: any[]): this
  abstract fatal(...args: any[]): this
  abstract clone(context?: string | undefined, level?: LoggerLevel | undefined, errorStack?: ErrorStack): Logger

  is(level: LoggerLevel) {
    return this.level?.is(level)
  }

  addIndent(indent = 1) {
    this.indent.add(indent)
  }

  removeIndent(indent = 1) {
    this.indent.add(indent * -1)
  }

  setLevel(level: LoggerLevel) {
    if (!LoggerFactory.DEBUG_CONTEXTS?.[this.context] && !LoggerFactory.DEBUG) {
      this.level = LevelFactory.GetInstance(level)
    }
  }
}
