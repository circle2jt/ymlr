import { type Level } from './level'
import { DebugLevel } from './level/debug-level'
import { ErrorLevel } from './level/error-level'
import { FatalLevel } from './level/fatal-level'
import { InfoLevel } from './level/info-level'
import { LogLevel } from './level/log-level'
import { SilentLevel } from './level/silent-level'
import { TraceLevel } from './level/trace-level'
import { WarnLevel } from './level/warn-level'
import { LoggerLevel } from './logger-level'

export class LevelFactory {
  static readonly #Instance = new Map<number, Level>()

  static GetLogInstance() {
    const level = -1
    let levelObj = this.#Instance.get(level)
    if (levelObj) { return levelObj }

    levelObj = new LogLevel()
    this.#Instance.set(level, levelObj)
    return levelObj
  }

  static GetInstance(level: LoggerLevel) {
    let levelObj: Level | undefined | null = this.#Instance.get(level)
    if (levelObj) { return levelObj }

    switch (level) {
      case LoggerLevel.all:
      case LoggerLevel.trace:
        levelObj = new TraceLevel()
        break
      case LoggerLevel.debug:
        levelObj = new DebugLevel()
        break
      case LoggerLevel.info:
        levelObj = new InfoLevel()
        break
      case LoggerLevel.warn:
        levelObj = new WarnLevel()
        break
      case LoggerLevel.error:
        levelObj = new ErrorLevel()
        break
      case LoggerLevel.fatal:
        levelObj = new FatalLevel()
        break
      case LoggerLevel.silent:
        levelObj = new SilentLevel()
        break
    }
    if (levelObj) {
      this.#Instance.set(level, levelObj)
    }
    return levelObj
  }
}
