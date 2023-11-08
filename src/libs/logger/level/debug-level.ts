import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class DebugLevel extends Level {
  readonly icon = chalk.gray('D')

  constructor() {
    super(LoggerLevel.debug)
  }

  override format(msg: string) {
    return chalk.gray(msg)
  }
}
