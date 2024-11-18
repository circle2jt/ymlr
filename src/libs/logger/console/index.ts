import chalk from 'chalk'
import { App } from 'src/app'
import { type ErrorStack } from 'src/libs/error-stack'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { Logger } from '..'
import { LevelFactory } from '../level-factory'
import { LoggerLevel } from '../logger-level'

export const SPACE = chalk.gray('┆')

export class ConsoleLogger extends Logger {
  #threadID = chalk.gray.dim(App.ThreadID)

  get #timestamp() {
    return chalk.gray(UtilityFunctionManager.Instance.format.date(new Date(), 'hh:mm:ss.ms'))
  }

  get #fullContextPath() {
    return chalk.gray.dim.italic(this.fullContextPath)
  }

  get #indentString() {
    return this.indent.indentString
  }

  override trace(msg: any, ...prms: any) {
    return this.print(LoggerLevel.trace, console.debug, msg, ...prms)
  }

  override debug(msg: any, ...prms: any) {
    return this.print(LoggerLevel.debug, console.debug, msg, ...prms)
  }

  override info(msg: any, ...prms: any) {
    return this.print(LoggerLevel.info, console.info, msg, ...prms)
  }

  override pass(msg: any, ...prms: any) {
    return this.print(LoggerLevel.pass, console.info, msg, ...prms)
  }

  override warn(msg: any, ...prms: any) {
    return this.print(LoggerLevel.warn, console.warn, msg, ...prms)
  }

  override fail(msg: any, ...prms: any) {
    return this.print(LoggerLevel.fail, console.error, msg, ...prms)
  }

  override error(msg: any, ...prms: any) {
    return this.print(LoggerLevel.error, console.error, msg, ...prms)
  }

  override fatal(msg: any, ...prms: any) {
    this.print(LoggerLevel.fatal, console.error, msg, ...prms)
    if (this.errorStack) {
      this.trace(this.errorStack)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel, errorStack?: ErrorStack) {
    if (errorStack) {
      this.errorStack = { ...this.errorStack, ...errorStack }
    }
    const logger = new ConsoleLogger(level || this.level.level, context || this.context, this.errorStack, this.indent.clone())
    logger.contextPath = this.fullContextPath
    return logger
  }

  // override dispose() {}

  private print(level: LoggerLevel, printToConsole: (...args: any[]) => any, msg: string | any, ...prms: any) {
    if (typeof msg === 'string') {
      printToConsole(`%s %s %s %s ${LevelFactory.GetInstance(level).format(msg)} \t %s`,
        this.#threadID,
        this.#timestamp,
        LevelFactory.GetInstance(level).icon,
        this.#indentString,
        chalk.gray.dim.italic(this.fullContextPath),
        ...prms)
    } else {
      printToConsole(`%s %s %s %s ${LevelFactory.GetInstance(level).format('%o')} \t %s`,
        this.#threadID,
        this.#timestamp,
        LevelFactory.GetInstance(level).icon,
        this.#indentString,
        msg,
        this.#fullContextPath,
        ...prms)
    }
    return this
  }
}
