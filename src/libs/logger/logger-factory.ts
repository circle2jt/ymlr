import ENVGlobal from 'src/env-global'
import { type ErrorStack } from 'src/libs/error-stack'
import { type Logger } from '.'
import { ConsoleLogger } from './console'
import { type Level } from './level'
import { LevelFactory } from './level-factory'
import { GetLoggerLevel, type LoggerLevel } from './logger-level'

export class LoggerFactory {
  static DEBUG?: Level
  static DEBUG_SECRET?: boolean
  static DEBUG_CONTEXT_FILTER?: RegExp

  static LoadFromEnv() {
    if (ENVGlobal.DEBUG_SECRET === '1') {
      LoggerFactory.DEBUG_SECRET = true
    }
    if (ENVGlobal.DEBUG) {
      const defaultLoggerLevel = GetLoggerLevel(ENVGlobal.DEBUG || 'info')
      if (!defaultLoggerLevel) {
        throw new Error(`--debug "${ENVGlobal.DEBUG}", Log level is not valid`)
      }
      LoggerFactory.DEBUG = LevelFactory.GetInstance(defaultLoggerLevel)
    }
    LoggerFactory.DEBUG_CONTEXT_FILTER = ENVGlobal.DEBUG_CONTEXT_FILTER ? new RegExp(ENVGlobal.DEBUG_CONTEXT_FILTER) : undefined
  }

  static Dispose() { }

  static NewLogger(level?: LoggerLevel, context?: string, errorStack?: ErrorStack, parent?: Logger) {
    const logger = new ConsoleLogger(level, context, errorStack, parent)
    return logger as Logger
  }
}
