import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class SecretLevel extends Level {
  readonly icon = chalk.cyan('****')

  constructor() {
    super(LoggerLevel.secret)
  }

  override format(msg: string) {
    return chalk.cyan(msg)
  }
}
