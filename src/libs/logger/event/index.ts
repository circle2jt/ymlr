import { Console } from 'console'
import { GlobalEvent } from 'src/libs/global-event'
import { Constants } from 'src/managers/constants'
import { ConsoleLogger } from '../console'
import { type LoggerLevel } from '../logger-level'

export class EventLogger extends ConsoleLogger {
  static SetOutput(opts: { console?: boolean, colorMode?: boolean }) {
    if (opts.console) {
      ConsoleLogger.SetConsole(new Console({
        colorMode: opts.colorMode,
        stdout: process.stdout,
        stderr: process.stderr
      }))
    }
  }

  protected override print(mes: string, level: LoggerLevel) {
    GlobalEvent.emit(Constants.LOG_EVENT, mes, level)
    super.print(mes, level)
    return this
  }

  override clone(context?: string, level?: LoggerLevel) {
    return new EventLogger(level || this.level?.level, context || this.context, this.indent.clone())
  }
}
