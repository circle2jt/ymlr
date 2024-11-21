import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class ErrorLevel extends Level {
  readonly icon = 'erro'

  constructor() {
    super(LoggerLevel.error)
  }

  override format(msg: string) {
    return chalk.red(msg)
  }
}
