import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class ErrorLevel extends Level {
  constructor() {
    super(LevelNumber.error)
  }

  format(msg: string) {
    return `${chalk.redBright('┆')} ${chalk.redBright(msg)}`
  }
}
