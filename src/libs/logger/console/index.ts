import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { Logger } from '..'
import { type Level } from '../level'
import { LevelFactory } from '../level-factory'
import { LoggerFactory } from '../logger-factory'
import { LoggerLevel } from '../logger-level'

export class ConsoleLogger extends Logger {
  private static MaxContextLength = 0

  private tab = ''
  private maxContextLength = 0

  override set context(ctx: string) {
    super.context = ctx
    const maxLength = this.indent.indentStringLength + this.context.length
    if (ConsoleLogger.MaxContextLength < maxLength) ConsoleLogger.MaxContextLength = maxLength
  }

  override get context() {
    return super.context
  }

  get prefix() {
    if (!this.level) {
      return ''
    }
    return `${this.time} ${chalk.blue(this.context)} ${this.tab}`
  }

  get time() {
    return chalk.gray(`#${LoggerFactory.PROCESS_ID} `) + chalk.dim(UtilityFunctionManager.Instance.format.date(new Date(), 'hh:mm:ss.ms'))
  }

  override log(msg: any, ...prms: any) {
    if (typeof msg === 'string') {
      this.splitRawMsg(msg, LevelFactory.GetLogInstance(), ...prms).forEach((msgs: any[]) => { console.log(...msgs) })
    } else {
      console.log(`${this.formatRaw('%j', LevelFactory.GetLogInstance())}`, msg, ...prms)
    }
    return this
  }

  override info(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.info)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.info), ...prms).forEach((msgs: any[]) => { console.info(...msgs) })
      } else {
        console.info(this.format('%j', LevelFactory.GetInstance(LoggerLevel.info)), msg, ...prms)
      }
    }
    return this
  }

  override debug(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.debug)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.debug), ...prms).forEach((msgs: any[]) => { console.debug(...msgs) })
      } else {
        console.debug(this.format('%j', LevelFactory.GetInstance(LoggerLevel.debug)), msg, ...prms)
      }
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.warn)) {
      // Logger.Event?.emit(LoggerLevel.warn)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.warn), ...prms).forEach((msgs: any[]) => { console.warn(...msgs) })
      } else {
        console.warn(this.format('%o', LevelFactory.GetInstance(LoggerLevel.warn)), msg, ...prms)
      }
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.trace)) {
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.trace), ...prms).forEach((msgs: any[]) => { console.debug(...msgs) })
      } else {
        console.debug(this.format('%o', LevelFactory.GetInstance(LoggerLevel.trace)), msg, ...prms)
      }
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.error)) {
      // Logger.Event?.emit(LoggerLevel.error)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.error), ...prms).forEach((msgs: any[]) => { console.error(...msgs) })
      } else {
        console.error(this.format('%o', LevelFactory.GetInstance(LoggerLevel.error)), msg, ...prms)
      }
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.fatal)) {
      // Logger.Event?.emit(LoggerLevel.fatal)
      this.syncTab()
      if (typeof msg === 'string') {
        this.splitMsg(msg, LevelFactory.GetInstance(LoggerLevel.fatal), ...prms).forEach((msgs: any[]) => { console.error(...msgs) })
      } else {
        console.error(this.format('%o', LevelFactory.GetInstance(LoggerLevel.fatal)), msg, ...prms)
      }
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel | Level) {
    return new ConsoleLogger(level || this.level?.level, context || this.context, this.indent.clone())
  }

  override addIndent(indent = 1) {
    super.addIndent(indent)
    const maxLength = this.indent.indentStringLength + this.context.length
    if (ConsoleLogger.MaxContextLength < maxLength) ConsoleLogger.MaxContextLength = maxLength
  }

  private syncTab() {
    if (this.maxContextLength === ConsoleLogger.MaxContextLength) return
    this.maxContextLength = ConsoleLogger.MaxContextLength
    this.tab = new Array(this.maxContextLength - this.context.length).fill(' ').join('')
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
