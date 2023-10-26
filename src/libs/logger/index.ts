import { Indent } from './indent'
import { type Level } from './level'
import { LevelFactory } from './level-factory'
import { LevelNumber } from './level-number'
import { LoggerFactory } from './logger-factory'
import { type LoggerLevel } from './logger-level'

export abstract class Logger {
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
    if (LoggerFactory.DEBUG_CONTEXTS?.[this.context]) {
      this.level = LevelFactory.GetInstance(LevelNumber[LoggerFactory.DEBUG_CONTEXTS[this.context]])
    } else {
      if (typeof level === 'string') {
        this.setLevelFromName(level)
      } else {
        this.level = level
      }
    }
    if (this.level === undefined && LoggerFactory.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[LoggerFactory.DEBUG])
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
    if (!LoggerFactory.DEBUG_CONTEXTS?.[this.context] && !LoggerFactory.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[level])
    }
  }
}
