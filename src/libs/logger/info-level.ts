import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class InfoLevel extends Level {
  constructor() {
    super(LevelNumber.info)
  }

  override format(msg: string) {
    return [chalk.bgGreen('[I]') + ' ', chalk.green(msg)]
  }
}
