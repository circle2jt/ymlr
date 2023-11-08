import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class FatalLevel extends Level {
  readonly icon = chalk.red('F')

  constructor() {
    super(LoggerLevel.fatal)
  }

  override format(msg: string) {
    return chalk.red(msg)
  }
}
