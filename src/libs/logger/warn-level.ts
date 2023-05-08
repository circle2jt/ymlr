import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class WarnLevel extends Level {
  constructor() {
    super(LevelNumber.warn)
  }

  format(msg: string) {
    return `${chalk.yellow('┆')} ${chalk.yellow(msg)}`
  }
}
