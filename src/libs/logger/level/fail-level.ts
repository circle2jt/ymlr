import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class FailLevel extends Level {
  readonly icon = chalk.redBright('fail')

  constructor() {
    super(LoggerLevel.error)
  }

  override format(msg: string) {
    return chalk.redBright(msg)
  }
}
