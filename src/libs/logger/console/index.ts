import chalk from 'chalk'
import { Logger } from '..'
import { formatFixLengthNumber } from '../../format'
import { type Indent } from '../indent'
import { type Level } from '../level'
import { LevelFactory } from '../level-factory'
import { LevelNumber } from '../level-number'
import { type LoggerLevel } from '../logger-level'

export class ConsoleLogger extends Logger {
  private static MaxContextLength = 0

  private tab = ''
  private maxContextLength = 0

  override set context(ctx: string) {
    this._context = ctx
    const maxLength = this.indent.indentStringLength + this._context.length
    if (ConsoleLogger.MaxContextLength < maxLength) ConsoleLogger.MaxContextLength = maxLength
  }

  override get context() {
    return this._context
  }

  static Dispose() { }

  constructor(level?: LoggerLevel | Level | undefined, context = '', indent?: Indent) {
    super(level, context, indent)
    this.context = context
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

  get prefix() {
    if (!this.level) {
      return ''
    }
    return `${this.time} ${chalk.blue(this.context)} ${this.tab}`
  }

  get time() {
    const date = new Date()
    return chalk.gray(`#${Logger.PROCESS_ID} `) + chalk.dim(`${formatFixLengthNumber(date.getHours(), 2)}:${formatFixLengthNumber(date.getMinutes(), 2)}:${formatFixLengthNumber(date.getSeconds(), 2)}.${formatFixLengthNumber(date.getMilliseconds(), 3)}`)
  }

  override log(msg: any, ...prms: any) {
    if (typeof msg === 'string') {
      this.splitRawMsg(msg, LevelFactory.GetLogInstance(), ...prms).forEach((msgs: any[]) => { console.log(...msgs) })
    } else {
      prms.splice(0, 0, msg)
      console.log(`${this.formatRaw('%j', LevelFactory.GetLogInstance())}`, ...prms)
    }
    return this
  }

  override info(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LevelNumber.info)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.info), ...prms).forEach((msgs: any[]) => { console.info(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.info(this.format('%j', LevelFactory.GetInstance(LevelNumber.info)), ...prms)
      }
    }
    return this
  }

  override debug(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.debug)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.debug), ...prms).forEach((msgs: any[]) => { console.debug(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.debug(this.format('%j', LevelFactory.GetInstance(LevelNumber.debug)), ...prms)
      }
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LevelNumber.warn)) {
      // Logger.Event?.emit(LoggerLevel.WARN)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.warn), ...prms).forEach((msgs: any[]) => { console.warn(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.warn(this.format('%o', LevelFactory.GetInstance(LevelNumber.warn)), ...prms)
      }
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LevelNumber.trace)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.trace), ...prms).forEach((msgs: any[]) => { console.debug(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.debug(this.format('%o', LevelFactory.GetInstance(LevelNumber.trace)), ...prms)
      }
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LevelNumber.error)) {
      // Logger.Event?.emit(LoggerLevel.ERROR)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.error), ...prms).forEach((msgs: any[]) => { console.error(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.error(this.format('%o', LevelFactory.GetInstance(LevelNumber.error)), ...prms)
      }
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LevelNumber.fatal)) {
      // Logger.Event?.emit(LoggerLevel.FATAL)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LevelNumber.fatal), ...prms).forEach((msgs: any[]) => { console.error(...msgs) })
      } else {
        prms.splice(0, 0, msg)
        console.error(this.format('%o', LevelFactory.GetInstance(LevelNumber.fatal)), ...prms)
      }
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel | Level) {
    return new ConsoleLogger(level || this.level, context || this.context, this.indent.clone())
  }

  override addIndent(indent = 1) {
    super.addIndent(indent)
    const maxLength = this.indent.indentStringLength + this._context.length
    if (ConsoleLogger.MaxContextLength < maxLength) ConsoleLogger.MaxContextLength = maxLength
  }

  private syncTab() {
    if (this.maxContextLength === ConsoleLogger.MaxContextLength) return
    this.maxContextLength = ConsoleLogger.MaxContextLength
    this.tab = chalk.gray(new Array(this.maxContextLength - this.context.length).fill(' ').join(''))
  }

  private splitMsg(msg: string, level: Level | undefined, ...prms: any): string[][] {
    return msg
      .split('\n')
      .map((msg: string, i: number) => {
        msg = (i === 0 ? '' : '  ') + msg
        return [this.format(msg, i !== 0 ? undefined : level), ...prms]
      })
  }

  private splitRawMsg(msg: string, level: Level | undefined, ...prms: any): string[][] {
    return msg
      .split('\n')
      .map((msg: string, i: number) => {
        msg = (i === 0 ? '' : '  ') + msg
        return [this.formatRaw(msg, i !== 0 ? undefined : level), ...prms]
      })
  }

  private formatRaw(msg: string, level?: Level) {
    if (level) {
      const [icon, txt] = level.format(msg)
      return icon + this.indent.format(txt)
    }
    return this.indent.format(msg)
  }

  private format(msg: string, level?: Level) {
    if (level) {
      const [icon, txt] = level.format(msg)
      return this.prefix + icon + this.indent.format(txt)
    }
    return this.prefix + this.indent.format(msg)
  }
}
