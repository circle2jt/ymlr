import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class DebugLevel extends Level {
  constructor() {
    super(LoggerLevel.debug)
  }

  override format(msg: string) {
    return [chalk.bgBlack.bold('[D]') + ' ', chalk.gray(msg)]
  }
}
