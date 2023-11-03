import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class FatalLevel extends Level {
  constructor() {
    super(LoggerLevel.fatal)
  }

  override format(msg: string) {
    return [chalk.bgRed.bold('[F]') + ' ', chalk.red(msg)]
  }
}
