import chalk from 'chalk'
import EventEmitter from 'events'
import { App } from 'src/app'
import { type ErrorStack } from 'src/libs/error-stack'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { Logger } from '..'
import { Indent } from '../indent'
import { type Level } from '../level'
import { GetLoggerLevelName, LoggerLevel } from '../logger-level'

export const SPACE = chalk.gray('┆')

export class ConsoleLogger extends Logger {
  private static readonly UpdateEvent = new EventEmitter().setMaxListeners(0)
  private readonly updateContext: () => void
  private static MaxContextLength = 0
  private tab = ''

  set context(ctx: string) {
    super.context = ctx
    if (this.context?.length > ConsoleLogger.MaxContextLength) {
      ConsoleLogger.MaxContextLength = this.context.length
      ConsoleLogger.UpdateEvent.emit('update-context')
    }
  }

  get context() {
    return super.context
  }

  constructor(level: LoggerLevel | Level | undefined, context = '', errorStack: ErrorStack = {}, id = Logger.GenID(), indent = new Indent()) {
    super(level, context, errorStack, id, indent)
    this.updateContext = () => {
      this.tab = new Array(ConsoleLogger.MaxContextLength - this.context.length).fill('┄').join('')
    }
    ConsoleLogger.UpdateEvent.on('update-context', this.updateContext)
    this.context = context
  }

  getPrefixMsg(level: any) {
    return `${App.ThreadID} [${UtilityFunctionManager.Instance.format.date(new Date(), 'hh:mm:ss.ms')}] ${GetLoggerLevelName(level)} ${chalk.blue(this.context + ' ' + this.tab)} ${this.indent.indentString}`
  }

  override info(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.info)) {
      if (typeof msg === 'string') {
        console.info(this.getPrefixMsg(LoggerLevel.info) + ' ' + msg, ...prms)
      } else {
        console.info(this.getPrefixMsg(LoggerLevel.info) + ' %o', msg, ...prms)
      }
    }
    return this
  }

  override debug(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.debug)) {
      if (typeof msg === 'string') {
        console.debug(this.getPrefixMsg(LoggerLevel.debug) + ' ' + msg, ...prms)
      } else {
        console.debug(this.getPrefixMsg(LoggerLevel.debug) + ' %o', msg, ...prms)
      }
    }
    return this
  }

  override warn(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.warn)) {
      if (typeof msg === 'string') {
        console.warn(this.getPrefixMsg(LoggerLevel.warn) + ' ' + msg, ...prms)
      } else {
        console.warn(this.getPrefixMsg(LoggerLevel.warn) + ' %o', msg, ...prms)
      }
    }
    return this
  }

  override trace(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.trace)) {
      if (typeof msg === 'string') {
        console.debug(this.getPrefixMsg(LoggerLevel.trace) + ' ' + msg, ...prms)
      } else {
        console.debug(this.getPrefixMsg(LoggerLevel.trace) + ' %o', msg, ...prms)
      }
    }
    return this
  }

  override error(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.error)) {
      if (typeof msg === 'string') {
        console.error(this.getPrefixMsg(LoggerLevel.error) + ' ' + msg, ...prms)
      } else {
        console.error(this.getPrefixMsg(LoggerLevel.error) + ' %o', msg, ...prms)
      }
    }
    return this
  }

  override fatal(msg: any, ...prms: any) {
    if (this.level?.is(LoggerLevel.fatal)) {
      if (typeof msg === 'string') {
        console.error(this.getPrefixMsg(LoggerLevel.fatal) + ' ' + msg, ...prms)
      } else {
        console.error(this.getPrefixMsg(LoggerLevel.fatal) + ' %o', msg, ...prms)
      }
    }
    if (this.errorStack) {
      this.trace(this.errorStack)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel, errorStack?: ErrorStack) {
    if (errorStack) {
      this.errorStack = { ...this.errorStack, ...errorStack }
    }
    const logger = new ConsoleLogger(level || this.level?.level, context || this.context, this.errorStack, this.id, this.indent.clone())
    return logger
  }

  override dispose() {
    ConsoleLogger.UpdateEvent.off('update-context', this.updateContext)
  }
}
