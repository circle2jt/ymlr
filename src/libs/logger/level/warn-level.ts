import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class WarnLevel extends Level {
  readonly icon = 'warn'
  readonly iconColor = chalk.yellow(this.icon)

  constructor() {
    super(LoggerLevel.warn)
  }

  override format(msg: string) {
    return chalk.yellow(msg)
  }
}
