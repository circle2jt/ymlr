import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class DebugLevel extends Level {
  constructor() {
    super(LevelNumber.debug)
  }

  format(msg: string) {
    return `${chalk.gray('┆')} ${chalk.gray(msg)}`
  }
}
