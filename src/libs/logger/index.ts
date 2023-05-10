import chalk from 'chalk'
import EventEmitter from 'events'
import { formatFixLengthNumber } from '../format'
import { Indent } from './indent'
import { Level } from './level'
import { LevelFactory } from './level-factory'
import { LevelNumber } from './level-number'
import { LoggerLevel } from './logger-level'

export class Logger {
  private static _PROCESS_ID = ''
  private static MaxContextLength = 0
  private static Event?: EventEmitter

  static DEBUG?: LoggerLevel
  static DEBUG_CONTEXTS?: Record<string, LoggerLevel>

  // eslint-disable-next-line accessor-pairs
  static set PROCESS_ID(gname: string) {
    this._PROCESS_ID = chalk.gray(` \t#${gname}`)
  }

  static On(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => {}) {
    if (!this.Event) this.Event = new EventEmitter().setMaxListeners(0)
    eventNames.forEach(eventName => this.Event?.on(eventName, cb))
  }

  static Off(eventNames: Array<LoggerLevel.WARN | LoggerLevel.ERROR | LoggerLevel.FATAL>, cb: () => {}) {
    this.Event && eventNames.forEach(eventName => this.Event?.off(eventName, cb))
  }

  static Dispose() {
    this.Event?.removeAllListeners()
    this.Event = undefined
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
    if (Logger.DEBUG_CONTEXTS?.[this.context]) {
      this.level = LevelFactory.GetInstance(LevelNumber[Logger.DEBUG_CONTEXTS[this.context]])
    } else if (Logger.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[Logger.DEBUG])
    } else {
      if (typeof level === 'string') {
        this.setLevelFromName(level)
      } else {
        this.level = level
      }
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
    if (!Logger.DEBUG_CONTEXTS?.[this.context] && !Logger.DEBUG) {
      this.level = LevelFactory.GetInstance(LevelNumber[level])
    }
  }

  is(levelName: LoggerLevel) {
    return this.level?.is(LevelNumber[levelName])
  }

  log(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.info)) {
      if (typeof msg === 'string') {
        this.splitRawMsgThenPrint(msg, LevelFactory.GetLogInstance(), ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.formatRaw('%j', LevelFactory.GetLogInstance())}`, ...prms)
      }
    }
    return this
  }

  label(msg: string) {
    this.log(`${chalk.green('○')} ${msg} ${Logger._PROCESS_ID} `)
    return this
  }

  passed(msg: any, level?: LoggerLevel) {
    if (this.level?.is(!level ? LevelNumber.debug : LevelNumber[level])) {
      this.print(this.indent.format(`${chalk.green('✔')} ${msg} ${Logger._PROCESS_ID} `))
    }
    return this
  }

  failed(msg: any, level?: LoggerLevel) {
    if (this.level?.is(!level ? LevelNumber.debug : LevelNumber[level])) {
      this.print(this.indent.format(`${chalk.red('✘')} ${msg} ${Logger._PROCESS_ID} `))
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
      Logger.Event?.emit(LoggerLevel.WARN)
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
      Logger.Event?.emit(LoggerLevel.ERROR)
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
      Logger.Event?.emit(LoggerLevel.FATAL)
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

  private splitRawMsgThenPrint(msg: string, level: Level | undefined, ...prms: any) {
    msg.split('\n').forEach((msg: string, i: number) => {
      msg = (i === 0 ? '' : '  ') + msg
      this.print(`${this.formatRaw(msg, i !== 0 ? undefined : level)}`, ...prms)
    })
  }

  private formatRaw(msg: string, level?: Level) {
    if (level) {
      return this.indent.format(level.format(msg))
    }
    return this.indent.format(msg)
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
