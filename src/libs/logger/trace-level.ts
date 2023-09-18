import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class TraceLevel extends Level {
  constructor() {
    super(LevelNumber.trace)
  }

  format(msg: string) {
    return `${chalk.bgMagenta('[T]')} ${chalk.magenta(msg)}`
  }
}
