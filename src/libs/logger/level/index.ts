import { GetLoggerLevel, type LoggerLevel } from '../logger-level'

export abstract class Level {
  abstract readonly icon: string
  abstract readonly iconColor: string

  get name() {
    return GetLoggerLevel(this.level)
  }

  constructor(public level: LoggerLevel) { }

  abstract format(msg: string): string

  is(level: LoggerLevel) {
    return this.level <= level
  }
}
