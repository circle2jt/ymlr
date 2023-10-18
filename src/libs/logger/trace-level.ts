import chalk from 'chalk'
import { Level } from './level'
import { LevelNumber } from './level-number'

export class TraceLevel extends Level {
  constructor() {
    super(LevelNumber.trace)
  }

  override format(msg: string) {
    return [chalk.bgMagenta.bold('[T]') + ' ', chalk.magenta(msg)]
  }
}
