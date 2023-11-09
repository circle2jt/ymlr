import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { format } from 'util'
import { Logger } from '..'
import { type Level } from '../level'
import { LevelFactory } from '../level-factory'
import { LoggerFactory } from '../logger-factory'
import { LoggerLevel } from '../logger-level'

const SPACE = chalk.gray('╎')

export class ConsoleLogger extends Logger {
  static readonly DISABLE_PREFIX = Symbol('DISABLE_PREFIX')
  static #MaxContextLength = 0
  static #Console: Console

  #tab = ''

  static SetConsole(console: Console) {
    ConsoleLogger.#Console = console
  }

  override log(msg: any, ...prms: any) {
    if (this.level?.level !== LoggerLevel.silent) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.log, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.log, msg, ...prms)
      }
      ConsoleLogger.#Console.log(mes)
    }
    return this
  }

  override info(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.info)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.info, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.info, msg, ...prms)
      }
      ConsoleLogger.#Console.info(mes)
    }
    return this
  }

  override debug(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.debug)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.debug, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.debug, msg, ...prms)
      }
      ConsoleLogger.#Console.debug(mes)
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.warn)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.warn, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.warn, msg, ...prms)
      }
      ConsoleLogger.#Console.warn(mes)
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.trace)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.trace, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.trace, msg, ...prms)
      }
      ConsoleLogger.#Console.debug(mes)
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.error)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.error, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.error, msg, ...prms)
      }
      ConsoleLogger.#Console.error(mes)
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.fatal)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.fatal, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.fatal, msg, ...prms)
      }
      ConsoleLogger.#Console.error(mes)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel | Level) {
    return new ConsoleLogger(level || this.level?.level, context || this.context, this.indent.clone())
  }

  private syncTab() {
    if (ConsoleLogger.#MaxContextLength < this.context.length) {
      ConsoleLogger.#MaxContextLength = this.context.length
    }
    const tabCount = ConsoleLogger.#MaxContextLength - this.context.length
    if (this.#tab.length !== tabCount) {
      this.#tab = new Array(tabCount).fill('┄').join('')
    }
  }

  private format(msg: string, loggerLevel: LoggerLevel, ...prms: any[]) {
    const isPrefix = prms[prms.length - 1] !== ConsoleLogger.DISABLE_PREFIX
    if (!isPrefix) {
      prms.splice(prms.length - 1, 1)
    }
    this.syncTab()
    let prefix = ''
    let icon = ''
    let txt = msg
    const level = LevelFactory.GetInstance(loggerLevel)
    if (level) {
      icon = level.icon
      txt = level.format(txt)
    }

    if (isPrefix && this.level) {
      prefix = `${chalk.dim(LoggerFactory.PROCESS_ID)} ${SPACE} ${chalk.dim(UtilityFunctionManager.Instance.format.date(new Date(), 'hh:mm:ss.ms'))} ${SPACE} ${icon} ${SPACE} ${chalk.blue(this.context)}${chalk.dim(this.#tab)} ${SPACE} `
    }
    return format(prefix + this.indent.format(txt), ...prms)
  }
}
