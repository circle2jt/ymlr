import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class InfoLevel extends Level {
  readonly icon = chalk.green('I')

  constructor() {
    super(LoggerLevel.info)
  }

  override format(msg: string) {
    return chalk.green(msg)
  }
}
