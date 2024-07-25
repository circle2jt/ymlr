import chalk from 'chalk'
import EventEmitter from 'events'
import merge from 'lodash.merge'
import pino, { type LoggerOptions, type Logger as PLogger } from 'pino'
import { App } from 'src/app'
import { type ErrorStack } from 'src/libs/error-stack'
import { Logger } from '..'
import { Indent } from '../indent'
import { type Level } from '../level'
import { type LoggerLevel } from '../logger-level'
const { chindingsSym, msgPrefixSym } = require('pino/lib/symbols')

export const SPACE = chalk.gray('┆')

export class ConsoleLogger extends Logger {
  private static readonly UpdateEvent = new EventEmitter().setMaxListeners(0)
  private readonly updateContext: () => void
  private static MaxContextLength = 0

  logger!: PLogger

  addIndent(indent?: number) {
    super.addIndent(indent)
    if (!this.logger) return
    // @ts-expect-error Hack
    this.logger[msgPrefixSym] = this.indent.indentString
  }

  constructor(level: LoggerLevel | Level | undefined, context = '', errorStack: ErrorStack = {}, id = Logger.GenID(), indent = new Indent(), parent?: ConsoleLogger, loggerOptions?: LoggerOptions) {
    super(level, context, errorStack, id, indent)
    const { transport, base, ...others } = loggerOptions || {}
    this.logger = parent
      ? parent.logger.child({
        $ctx: this.context,
        $pad: ''
      }, {
        msgPrefix: indent.indentString,
        level: this.levelName
      })
      : pino({
        level: this.levelName,
        transport: merge({
          target: 'pino-pretty',
          options: {
            colorize: false,
            ignore: 'pid,hostname,$ctx,$tid,$pad',
            messageFormat: '{$tid} {$ctx}{$pad} {msg}'
          }
        }, transport),
        msgPrefix: indent.indentString,
        ...others,
        base: {
          $tid: App.ThreadID,
          $ctx: this.context,
          $pad: '',
          ...base
        }
      })
    this.updateContext = () => {
      // @ts-expect-error Hack
      this.logger[chindingsSym] = this.logger[chindingsSym]
        .replace(/"\$pad":"([^"]*)"/g, `"$pad":"${new Array(ConsoleLogger.MaxContextLength - this.context.length).fill('┄').join('')}"`)
    }

    if (this.context?.length > ConsoleLogger.MaxContextLength) {
      ConsoleLogger.MaxContextLength = this.context.length
      ConsoleLogger.UpdateEvent.emit('update-context')
    }
    this.updateContext()
    ConsoleLogger.UpdateEvent.on('update-context', this.updateContext)
  }

  override info(msg: any, ...prms: any) {
    this.logger.info(msg, ...prms)
    return this
  }

  override debug(msg: any, ...prms: any) {
    this.logger.debug(msg, ...prms)
    return this
  }

  override warn(msg: any, ...prms: any) {
    this.logger.warn(msg, ...prms)
    return this
  }

  override trace(msg: any, ...prms: any) {
    this.logger.trace(msg, ...prms)
    return this
  }

  override error(msg: any, ...prms: any) {
    this.logger.error(msg, ...prms)
    return this
  }

  override fatal(msg: any, ...prms: any) {
    this.logger.fatal(msg, ...prms)
    if (this.errorStack) {
      this.trace(this.errorStack)
    }
    return this
  }

  override clone(context?: string, level?: LoggerLevel, errorStack?: ErrorStack) {
    if (errorStack) {
      this.errorStack = { ...this.errorStack, ...errorStack }
    }
    const logger = new ConsoleLogger(level || this.level?.level, context || this.context, this.errorStack, this.id, this.indent.clone(), this)
    return logger
  }

  override dispose() {
    ConsoleLogger.UpdateEvent.off('update-context', this.updateContext)
  }
}
