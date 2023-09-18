import { DebugLevel } from './debug-level'
import { ErrorLevel } from './error-level'
import { FatalLevel } from './fatal-level'
import { InfoLevel } from './info-level'
import { type Level } from './level'
import { LevelNumber } from './level-number'
import { LogLevel } from './log-level'
import { type LoggerLevel } from './logger-level'
import { TraceLevel } from './trace-level'
import { WarnLevel } from './warn-level'

export class LevelFactory {
  private static readonly _Instance = new Map<number, Level>()

  static GetLogInstance() {
    const level = -1
    let levelObj = this._Instance.get(level)
    if (levelObj) { return levelObj }

    levelObj = new LogLevel()
    this._Instance.set(level, levelObj)
    return levelObj
  }

  static GetInstance(_level: LoggerLevel | LevelNumber) {
    const level = typeof _level === 'number' ? _level : LevelNumber[_level]
    let levelObj = this._Instance.get(level)
    if (levelObj) { return levelObj }

    switch (level) {
      case LevelNumber.all:
      case LevelNumber.trace:
        levelObj = new TraceLevel()
        break
      case LevelNumber.debug:
        levelObj = new DebugLevel()
        break
      case LevelNumber.info:
        levelObj = new InfoLevel()
        break
      case LevelNumber.warn:
        levelObj = new WarnLevel()
        break
      case LevelNumber.error:
        levelObj = new ErrorLevel()
        break
      case LevelNumber.fatal:
        levelObj = new FatalLevel()
        break
      default:
        return undefined
    }
    this._Instance.set(level, levelObj)
    return levelObj
  }
}
