import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class DebugLevel extends Level {
  constructor() {
    super(LevelNumber.debug)
  }

  override format(msg: string) {
    return [chalk.bgBlack('[D]') + ' ', chalk.gray(msg)]
  }
}
