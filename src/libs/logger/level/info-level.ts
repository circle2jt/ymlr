import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class InfoLevel extends Level {
  readonly icon = 'info'

  constructor() {
    super(LoggerLevel.info)
  }

  override format(msg: string) {
    return msg
  }
}
