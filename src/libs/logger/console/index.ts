import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
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
      return this.print(LoggerLevel.log, msg, ...prms)
    }
    return this
  }

  override info(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.info)) {
      return this.print(LoggerLevel.info, msg, ...prms)
    }
    return this
  }

  override debug(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.debug)) {
      return this.print(LoggerLevel.debug, msg, ...prms)
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.warn)) {
      return this.print(LoggerLevel.warn, msg, ...prms)
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.trace)) {
      return this.print(LoggerLevel.trace, msg, ...prms)
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.error)) {
      return this.print(LoggerLevel.error, msg, ...prms)
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (!this.level || this.level?.is(LoggerLevel.fatal)) {
      return this.print(LoggerLevel.fatal, msg, ...prms)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel | Level) {
    return new ConsoleLogger(level || this.level?.level, context || this.context, this.indent.clone())
  }

  private print(loggerLevel: LoggerLevel, msg: any, ...prms: any) {
    const isPrefix = prms[prms.length - 1] !== ConsoleLogger.DISABLE_PREFIX
    if (!isPrefix) {
      prms.splice(prms.length - 1, 1)
    }
    this.syncTab()
    if (typeof msg === 'string') {
      ConsoleLogger.#Console.info(this.format(msg, loggerLevel, isPrefix), ...prms)
    } else {
      ConsoleLogger.#Console.info(this.format('%j', loggerLevel, isPrefix), msg, ...prms)
    }
    return this
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

  private format(msg: string, loggerLevel: LoggerLevel, isPrefix: boolean) {
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
    return prefix + this.indent.format(txt)
  }
}
