import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class FatalLevel extends Level {
  constructor() {
    super(LevelNumber.fatal)
  }

  format(msg: string) {
    return `${chalk.bgRed('[F]')} ${chalk.red(msg)}`
  }
}
