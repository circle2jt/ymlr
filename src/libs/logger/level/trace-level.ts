import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class TraceLevel extends Level {
  readonly icon = 'trac'
  readonly iconColor = chalk.magenta(this.icon)

  constructor() {
    super(LoggerLevel.trace)
  }

  override format(msg: string) {
    return chalk.magenta(msg)
  }
}
