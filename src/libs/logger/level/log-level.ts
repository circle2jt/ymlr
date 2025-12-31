import { Level } from '../level'
import { LoggerLevel } from '../logger-level'

export class LogLevel extends Level {
  readonly icon = ''
  readonly iconColor = this.icon

  constructor() {
    super(LoggerLevel.info)
  }

  override format(msg: string) {
    return msg
  }
}
