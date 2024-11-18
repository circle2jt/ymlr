import { type Level } from './level'
import { DebugLevel } from './level/debug-level'
import { ErrorLevel } from './level/error-level'
import { FailLevel } from './level/fail-level'
import { FatalLevel } from './level/fatal-level'
import { InfoLevel } from './level/info-level'
import { PassLevel } from './level/pass-level'
import { SecretLevel } from './level/secret-level'
import { SilentLevel } from './level/silent-level'
import { TraceLevel } from './level/trace-level'
import { WarnLevel } from './level/warn-level'
import { LoggerLevel } from './logger-level'

export class LevelFactory {
  static readonly #Instance = new Map<number, Level>()

  static GetInstance(level: LoggerLevel) {
    let loggerLevel = this.#Instance.get(level)
    if (loggerLevel) {
      return loggerLevel
    }

    switch (level) {
      case LoggerLevel.all:
      case LoggerLevel.trace:
        loggerLevel = new TraceLevel()
        break
      case LoggerLevel.debug:
        loggerLevel = new DebugLevel()
        break
      case LoggerLevel.info:
        loggerLevel = new InfoLevel()
        break
      case LoggerLevel.pass:
        loggerLevel = new PassLevel()
        break
      case LoggerLevel.warn:
        loggerLevel = new WarnLevel()
        break
      case LoggerLevel.error:
        loggerLevel = new ErrorLevel()
        break
      case LoggerLevel.fail:
        loggerLevel = new FailLevel()
        break
      case LoggerLevel.fatal:
        loggerLevel = new FatalLevel()
        break
      case LoggerLevel.silent:
        loggerLevel = new SilentLevel()
        break
      case LoggerLevel.secret:
        loggerLevel = new SecretLevel()
        break
    }
    if (loggerLevel) {
      this.#Instance.set(level, loggerLevel)
    }
    return loggerLevel
  }
}
