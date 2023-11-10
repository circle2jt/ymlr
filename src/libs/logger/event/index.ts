import { Console } from 'console'
import { GlobalEvent } from 'src/libs/global-event'
import { ConsoleLogger } from '../console'
import { LoggerLevel } from '../logger-level'

export class EventLogger extends ConsoleLogger {
  static #Console?: Console

  static SetOutput(opts: { console?: boolean, colorMode?: boolean }) {
    if (opts.console) {
      this.#Console = new Console({
        colorMode: opts.colorMode,
        stdout: process.stdout,
        stderr: process.stderr
      })
    }
  }

  protected override print(mes: string, level: LoggerLevel) {
    GlobalEvent.emit('@app/logs', mes, level)
    if (EventLogger.#Console) {
      switch (level) {
        case LoggerLevel.log:
          EventLogger.#Console.log(mes)
          break
        case LoggerLevel.trace:
          EventLogger.#Console.debug(mes)
          break
        case LoggerLevel.debug:
          EventLogger.#Console.debug(mes)
          break
        case LoggerLevel.info:
          EventLogger.#Console.info(mes)
          break
        case LoggerLevel.warn:
          EventLogger.#Console.warn(mes)
          break
        case LoggerLevel.error:
          EventLogger.#Console.error(mes)
          break
        case LoggerLevel.fatal:
          EventLogger.#Console.error(mes)
          break
      }
    }
    return this
  }
}
