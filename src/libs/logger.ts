import chalk from 'chalk'
import EventEmitter from 'events'
import { formatFixLengthNumber } from './format'

export enum LoggerLevel {
  ALL = 'trace',
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  SILENT = 'silent',
}

const Mapping = {
  all: 1,
  trace: 2,
  debug: 4,
  info: 6,
  warn: 8,
  error: 10,
  fatal: 11,
  silent: 12
}

const Icon = {
  info: chalk.green('✔'),
  warn: chalk.yellow('⚠️'),
  error: chalk.red('✘'),
  fatal: chalk.red('❌'),
  trace: chalk.magenta('˖'),
  debug: '',
  others: '╎ ',
  debugBlock: {
    begin: chalk.red.dim('┌'),
    end: chalk.red.dim('└')
  }
}

const MappingValue = Object.keys(Mapping).reduce<Record<number, LoggerLevel>>((sum, e: any) => {
  // @ts-expect-error
  const lvNum = Mapping[e]
  sum[lvNum] = e
  return sum
}, {})

export class Logger {
  private static _GlobalName = ''
  private static _MaxContextLength = 0
  private static readonly _Event = new EventEmitter().setMaxListeners(0)

  // eslint-disable-next-line accessor-pairs
  static set globalName(gname: string) {
    this._GlobalName = chalk.gray(` \t#${gname}`)
  }

  level = Mapping.all
  indentString = ''
  tab = ''
  private _context = ''

  set context(ctx: string) {
    this._context = ctx
    if (this._context.length > Logger._MaxContextLength) {
      Logger._MaxContextLength = this._context.length
      Logger._Event.emit('update-tab')
    } else {
      this.syncTab()
    }
  }

  get context() {
    return this._context
  }

  get levelName() {
    return MappingValue[this.level]
  }

  get style() {
    return chalk
  }

  constructor(level: LoggerLevel | number, context = '', public indent = 0) {
    this.context = context
    this.setLevel(level)
    if (this.indent) this.updateIndent(this.indent)
    Logger._Event.on('update-tab', () => this.syncTab())
  }

  private syncTab() {
    this.tab = chalk.gray(new Array(Logger._MaxContextLength - this._context.length).fill('⊸').join(''))
  }

  is(level: LoggerLevel) {
    const lv = typeof level === 'number' ? level : Mapping[level]
    return lv !== Mapping.silent ? (this.level <= lv) : (this.level === lv)
  }

  clone(context?: string, level?: LoggerLevel) {
    return new Logger(level || this.level, context || this.context, this.indent)
  }

  updateIndent(indent: number) {
    this.indent = indent
    this.indentString = this.getIndentString(this.indent)
  }

  addIndent(indent = 1) {
    this.updateIndent(this.indent + indent)
  }

  removeIndent(indent = 1) {
    this.updateIndent(this.indent - indent)
  }

  getIndentString(indent: number) {
    const str = new Array(indent).fill(Icon.others).join('')
    return str && chalk.gray.dim(str)
  }

  get prefix() {
    return `${this.time} ${chalk.blue(this.context)}`
  }

  get time() {
    const date = new Date()
    return chalk.gray(`${formatFixLengthNumber(date.getHours(), 2)}:${formatFixLengthNumber(date.getMinutes(), 2)}:${formatFixLengthNumber(date.getSeconds(), 2)}.${formatFixLengthNumber(date.getMilliseconds(), 3)}`)
  }

  setLevel(level: LoggerLevel | number) {
    const lv = typeof level === 'number' ? level : Mapping[level]
    if (lv !== null && lv !== undefined) this.level = lv
  }

  print(...args: any) {
    console.log(...args)
  }

  log(msg: any, ...prms: any) {
    if (!this.is(LoggerLevel.SILENT)) {
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
    if (this.is(LoggerLevel.INFO)) {
      this.print(`${this.indentString}${chalk.green('○')} ${msg} ${Logger._GlobalName} `)
    }
    return this
  }

  passed(msg: any, level = LoggerLevel.DEBUG) {
    if (this.is(level)) {
      this.print(`${this.indentString}${chalk.green('✔')} ${msg} ${Logger._GlobalName} `)
    }
    return this
  }

  failed(msg: any, level = LoggerLevel.DEBUG) {
    if (this.is(level)) {
      this.print(`${this.indentString}${chalk.red('✘')} ${msg} ${Logger._GlobalName} `)
    }
    return this
  }

  info(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.INFO)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.INFO, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%j', LoggerLevel.INFO)}`, ...prms)
      }
    }
    return this
  }

  debug(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.DEBUG)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.DEBUG, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%j', LoggerLevel.DEBUG)}`, ...prms)
      }
    }
    return this
  }

  warn(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.WARN)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.WARN, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LoggerLevel.WARN)}`, ...prms)
      }
    }
    return this
  }

  trace(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.TRACE)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.TRACE, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LoggerLevel.TRACE)}`, ...prms)
      }
    }
    return this
  }

  error(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.ERROR)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.ERROR, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LoggerLevel.ERROR)}`, ...prms)
      }
    }
    return this
  }

  fatal(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.ERROR)) {
      if (typeof msg === 'string') {
        this.splitMsgThenPrint(msg, LoggerLevel.FATAL, ...prms)
      } else {
        prms.splice(0, 0, msg)
        this.print(`${this.format('%o', LoggerLevel.FATAL)}`, ...prms)
      }
    }
    return this
  }

  private splitMsgThenPrint(msg: string, level: LoggerLevel | undefined, ...prms: any) {
    msg.split('\n').forEach((msg: string, i: number) => {
      msg = (i === 0 ? '' : '  ') + msg
      this.print(`${this.format(msg, i !== 0 ? undefined : level)}`, ...prms)
    })
  }

  private formatWithoutIndent(msg: string, level?: LoggerLevel) {
    switch (level) {
      case LoggerLevel.INFO:
        return `${msg} ${Logger._GlobalName}`
      case LoggerLevel.WARN:
        return `${this.prefix} ${this.tab} ┆ ${chalk.yellow(`${msg}`)} ${Logger._GlobalName}`
      case LoggerLevel.ERROR:
        return `${this.prefix} ${this.tab} ┆ ${chalk.red(`${msg}`)} ${Logger._GlobalName}`
      case LoggerLevel.FATAL:
        return `${this.prefix} ${this.tab} ┆ ${chalk.red.bold(`${msg}`)} ${Logger._GlobalName}`
      case LoggerLevel.TRACE:
        return `${this.prefix} ${this.tab} ┆ ${chalk.magenta(`${msg}`)} ${Logger._GlobalName}`
      case LoggerLevel.DEBUG:
        return `${this.prefix} ${this.tab} ┆ ${chalk.gray(`${msg}`)} ${Logger._GlobalName}`
    }
    return `${msg}`
  }

  private format(msg: string, level?: LoggerLevel) {
    return `${this.indentString}${this.formatWithoutIndent(msg, level)}`
  }

  // private formatWithIcon(msg: string, icon: string, level?: LoggerLevel) {
  //   return `${this.indentString}${icon} ${this.formatWithoutIndent(msg, level)}`
  // }
}
