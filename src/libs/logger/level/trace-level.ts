import chalk from 'chalk'
import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class TraceLevel extends Level {
  constructor() {
    super(LoggerLevel.trace)
  }

  override format(msg: string) {
    return [chalk.bgMagenta.bold('[T]') + ' ', chalk.magenta(msg)]
  }
}
