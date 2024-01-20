import chalk from 'chalk'
import { App } from 'src/app'
import { ENABLE_LOGGER_PREFIX } from 'src/env'
import { type ErrorStack } from 'src/libs/error-stack'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { format } from 'util'
import { Logger } from '..'
import { LevelFactory } from '../level-factory'
import { LoggerLevel } from '../logger-level'

export const SPACE = chalk.gray('┆')

export class ConsoleLogger extends Logger {
  static readonly DISABLE_PREFIX = Symbol('DISABLE_PREFIX')
  static #MaxContextLength = 0
  static #Console?: Console

  #tab = ''

  static SetConsole(console: Console) {
    ConsoleLogger.#Console = console
  }

  protected print(mes: string, level: LoggerLevel) {
    if (ConsoleLogger.#Console) {
      switch (level) {
        case LoggerLevel.log:
          ConsoleLogger.#Console.log(mes)
          break
        case LoggerLevel.trace:
          ConsoleLogger.#Console.debug(mes)
          break
        case LoggerLevel.debug:
          ConsoleLogger.#Console.debug(mes)
          break
        case LoggerLevel.info:
          ConsoleLogger.#Console.info(mes)
          break
        case LoggerLevel.warn:
          ConsoleLogger.#Console.warn(mes)
          break
        case LoggerLevel.error:
          ConsoleLogger.#Console.error(mes)
          break
        case LoggerLevel.fatal:
          ConsoleLogger.#Console.error(mes)
          break
      }
    }
    return this
  }

  override log(msg: any, ...prms: any) {
    if (this.level?.level !== LoggerLevel.silent) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.log, ...prms)
      } else {
        mes = this.format('%j', LoggerLevel.log, msg, ...prms)
      }
      return this.print(mes, LoggerLevel.log)
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
      return this.print(mes, LoggerLevel.info)
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
      return this.print(mes, LoggerLevel.debug)
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.warn)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.warn, ...prms)
      } else {
        mes = this.format('%o', LoggerLevel.warn, msg, ...prms)
      }
      return this.print(mes, LoggerLevel.warn)
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.trace)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.trace, ...prms)
      } else {
        mes = this.format('%o', LoggerLevel.trace, msg, ...prms)
      }
      return this.print(mes, LoggerLevel.trace)
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.error)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.error, ...prms)
      } else {
        mes = this.format('%o', LoggerLevel.error, msg, ...prms)
      }
      this.print(mes, LoggerLevel.error)
      if (this.errorStack) {
        this.trace(this.errorStack)
      }
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.fatal)) {
      let mes: string
      if (typeof msg === 'string') {
        mes = this.format(msg, LoggerLevel.fatal, ...prms)
      } else {
        mes = this.format('%o', LoggerLevel.fatal, msg, ...prms)
      }
      this.print(mes, LoggerLevel.fatal)
      if (this.errorStack) {
        this.trace(this.errorStack)
      }
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel, errorStack?: ErrorStack) {
    if (errorStack) {
      this.errorStack = { ...this.errorStack, ...errorStack }
    }
    return new ConsoleLogger(level || this.level?.level, context || this.context, this.errorStack, this.id, this.indent.clone())
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
    const isDisabledPrefix = prms[prms.length - 1] === ConsoleLogger.DISABLE_PREFIX
    if (isDisabledPrefix) {
      prms.pop()
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

    if (!isDisabledPrefix && (
      (this.level && !ENABLE_LOGGER_PREFIX) || (ENABLE_LOGGER_PREFIX === '1')
    )) {
      prefix = `${chalk.dim(App.ProcessID)} ${SPACE} ${chalk.dim(UtilityFunctionManager.Instance.format.date(new Date(), 'hh:mm:ss.ms'))} ${SPACE} ${icon} ${SPACE} ${chalk.blue(this.context)}${chalk.dim(this.#tab)} ${SPACE} `
    }
    return format(prefix + this.indent.format(txt), ...prms)
  }
}
