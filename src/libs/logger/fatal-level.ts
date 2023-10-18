import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class FatalLevel extends Level {
  constructor() {
    super(LevelNumber.fatal)
  }

  override format(msg: string) {
    return [chalk.bgRed.bold('[F]') + ' ', chalk.red(msg)]
  }
}
