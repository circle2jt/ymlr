import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class SilentLevel extends Level {
  readonly icon = ''

  constructor() {
    super(LoggerLevel.silent)
  }

  override format(_msg: string) {
    return ''
  }

  override is(_: LoggerLevel) {
    return false
  }
}
