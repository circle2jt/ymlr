import { LoggerLevel } from '../logger-level'

export abstract class Level {
  get name() {
    return LoggerLevel[this.level]
  }

  constructor(public level: LoggerLevel) { }

  abstract format(msg: string): string[]

  is(level: LoggerLevel) {
    return level === LoggerLevel.silent ? (this.level === level) : this.level <= level
  }
}
