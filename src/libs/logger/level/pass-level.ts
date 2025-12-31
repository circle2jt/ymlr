import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class PassLevel extends Level {
  readonly icon = 'pass'
  readonly iconColor = chalk.green(this.icon)

  constructor() {
    super(LoggerLevel.info)
  }

  override format(msg: string) {
    return chalk.greenBright(msg)
  }
}
