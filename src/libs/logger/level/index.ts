import { LoggerLevel } from '../logger-level'

export abstract class Level {
  abstract readonly icon: string
  get name() {
    return LoggerLevel[this.level]
  }

  constructor(public level: LoggerLevel) { }

  abstract format(msg: string): string

  is(level: LoggerLevel) {
    return this.level <= level
  }
}
