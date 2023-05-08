import chalk from 'chalk'
import { formatFixLengthNumber } from '../format'
import { Indent } from './indent'
import { Level } from './level'
import { LevelFactory } from './level-factory'
import { LevelNumber } from './level-number'
import { LoggerLevel } from './logger-level'

export class Logger {
  private static _GlobalName = ''
  private static MaxContextLength = 0

  // eslint-disable-next-line accessor-pairs
  static set GlobalName(gname: string) {
    this._GlobalName = chalk.gray(` \t#${gname}`)
  }

  level?: Level
  indent: Indent

  private tab = ''
  private _context = ''
  private maxContextLength = 0

  set context(ctx: string) {
    this._context = ctx
    if (Logger.MaxContextLength < this._context.length) Logger.MaxContextLength = this._context.length
  }

  get context() {
    return this._context
  }

  get style() {
    return chalk
  }

  constructor(level: LoggerLevel | Level | undefined, context = '', indent?: Indent) {
    this.context = context
    if (typeof level === 'string') {
      this.setLevelFromName(level)
    } else {
      this.level = level
    }
    this.indent = indent || new Indent()
  }

  get prefix() {
    return `${this.time} ${chalk.blue(this.context)} ${this.tab}`
  }

  get time() {
    const date = new Date()
    return chalk.dim(`${formatFixLengthNumber(date.getHours(), 2)}:${formatFixLengthNumber(date.getMinutes(), 2)}:${formatFixLengthNumber(date.getSeconds(), 2)}.${formatFixLengthNumber(date.getMilliseconds(), 3)}`)
  }

  setLevelFromName(level: LoggerLevel) {
    this.level = LevelFactory.GetInstance(LevelNumber[level])
  }

  is(levelName: LoggerLevel) {
    return this.level?.is(LevelNumber[levelName])
  }

  log(msg: any, ...prms: any) {
    if (this.level && !this.level.is(LevelNumber.silent)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, undefined, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%j', undefined)}`, ...prms)
      }
    }
    return this
  }

  label(msg: string) {
    if (this.level?.is(LevelNumber.info)) {
      this.print(this.indent.format(`${chalk.green('○')} ${msg} ${Logger._GlobalName} `))
    }
    return this
  }

  passed(msg: any, level?: LoggerLevel) {
    if (this.level?.is(!level ? LevelNumber.debug : LevelNumber[level])) {
      this.print(this.indent.format(`${chalk.green('✔')} ${msg} ${Logger._GlobalName} `))
    }
    return this
  }

  failed(msg: any, level?: LoggerLevel) {
    if (this.level?.is(!level ? LevelNumber.debug : LevelNumber[level])) {
      this.print(this.indent.format(`${chalk.red('✘')} ${msg} ${Logger._GlobalName} `))
    }
    return this
  }

  info(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.info)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.info), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%j', LevelFactory.GetInstance(LevelNumber.info))}`, ...prms)
      }
    }
    return this
  }

  debug(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.debug)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.debug), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%j', LevelFactory.GetInstance(LevelNumber.debug))}`, ...prms)
      }
    }
    return this
  }

  warn(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.warn)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.warn), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LevelFactory.GetInstance(LevelNumber.warn))}`, ...prms)
      }
    }
    return this
  }

  trace(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.trace)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.trace), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LevelFactory.GetInstance(LevelNumber.trace))}`, ...prms)
      }
    }
    return this
  }

  error(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.error)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.error), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LevelFactory.GetInstance(LevelNumber.error))}`, ...prms)
      }
    }
    return this
  }

  fatal(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.fatal)) {
      if (this.maxContextLength !== Logger.MaxContextLength) this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LevelFactory.GetInstance(LevelNumber.fatal), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LevelFactory.GetInstance(LevelNumber.fatal))}`, ...prms)
      }
    }
    return this
  }

  addIndent(indent = 1) {
    this.indent.add(indent)
  }

  removeIndent(indent = 1) {
    this.indent.add(indent * -1)
  }

  clone(context?: string, level?: LoggerLevel | Level) {
    return new Logger(level || this.level, context || this.context, this.indent.clone())
  }

  private syncTab() {
    this.maxContextLength = Logger.MaxContextLength
    this.tab = chalk.gray(new Array(this.maxContextLength - this.context.length).fill('⊸').join(''))
  }

  private print(...args: any) {
    console.log(...args)
  }

  private splitMsgThenPrint(msg: string, level: Level | undefined, ...prms: any) {
    msg.split('\n').forEach((msg: string, i: number) => {
      msg = (i === 0 ? '' : '  ') + msg
      this.print(`${this.format(msg, i !== 0 ? undefined : level)}`, ...prms)
    })
  }

  private format(msg: string, level?: Level) {
    if (level) {
      return this.indent.format(this.prefix + ' ' + level.format(msg))
    }
    return this.indent.format(this.prefix + ' ' + msg)
  }
}
