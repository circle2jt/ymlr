import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class SilentLevel extends Level {
  readonly icon = 'sile'

  constructor() {
    super(LoggerLevel.silent)
  }

  override format(_msg: string) {
    return ''
  }
}
