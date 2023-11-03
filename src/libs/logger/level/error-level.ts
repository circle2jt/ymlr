import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class ErrorLevel extends Level {
  constructor() {
    super(LoggerLevel.error)
  }

  override format(msg: string) {
    return [chalk.bgRedBright.bold('[E]') + ' ', chalk.redBright(msg)]
  }
}
