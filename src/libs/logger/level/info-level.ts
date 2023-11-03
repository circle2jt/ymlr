import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class InfoLevel extends Level {
  constructor() {
    super(LoggerLevel.info)
  }

  override format(msg: string) {
    return [chalk.bgGreen.bold('[I]') + ' ', chalk.green(msg)]
  }
}
