import { Level } from './level'
import { LevelNumber } from './level-number'

export class LogLevel extends Level {
  constructor() {
    super(LevelNumber.info)
  }

  format(msg: string) {
    return msg
  }
}
