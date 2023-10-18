import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class ErrorLevel extends Level {
  constructor() {
    super(LevelNumber.error)
  }

  override format(msg: string) {
    return [chalk.bgRedBright.bold('[E]') + ' ', chalk.redBright(msg)]
  }
}
