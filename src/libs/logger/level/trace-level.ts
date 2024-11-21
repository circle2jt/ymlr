import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class TraceLevel extends Level {
  readonly icon = 'trac'

  constructor() {
    super(LoggerLevel.trace)
  }

  override format(msg: string) {
    return chalk.magenta(msg)
  }
}
