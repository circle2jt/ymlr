import { App } from 'src/app'
import { type ErrorStack } from 'src/libs/error-stack'
import { Logger } from '..'
import { Indent } from '../indent'
import { type Level } from '../level'
import { LoggerLevel } from '../logger-level'
import { StyleFactory } from './styles/style-factory'

export const V_SPACE = '│'
export const H_SPACE = '─╴'
export const V_SPACE_0 = '│'
export const H_SPACE_0 = '  '

export class ConsoleLogger extends Logger {
  indent = new Indent()

  constructor(level: LoggerLevel | Level | boolean = LoggerLevel.info, context = '', errorStack: ErrorStack | undefined, parent?: Logger) {
    super(level, context, errorStack, parent)
    this
      .on('addIndent', (indent = 1) => {
        this.indent.add(indent)
      })
      .on('removeIndent', (indent = 1) => {
        this.indent.add(indent * -1)
      })
  }

  override trace(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.debug, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.trace,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override debug(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.debug, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.debug,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override info(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.info, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.info,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override pass(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.info, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.pass,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override warn(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.warn, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.warn,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override fail(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.error, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.fail,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override error(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.error, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.error,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override secret(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.log, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.secret,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    return this
  }

  override fatal(msg: any, ...prms: any) {
    StyleFactory.Instance.print(console.error, {
      threadID: App.ThreadID,
      timestamp: new Date(),
      level: LoggerLevel.fatal,
      indent: this.indent,
      fullContextPath: this.fullContextPath,
      plainLog: this._plainLog
    }, msg, ...prms)
    if (this.errorStack) {
      this.trace(this.errorStack)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel | boolean, errorStack?: ErrorStack): Logger {
    const logger = new ConsoleLogger(level || this.level.level, context || this.context, { ...this.errorStack, ...errorStack }, this)
    logger.contextPath = this.fullContextPath
    logger.emit('addIndent', this.indent.indent)
    return logger
  }
}
