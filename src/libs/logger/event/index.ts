import { Console } from 'console'
import { GlobalEvent } from 'src/libs/global-event'
import { Writable } from 'stream'
import { ConsoleLogger } from '../console'

class EventStream extends Writable {
  _write(chunk: any, _: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    const mes = chunk.toString().replace(/\n$/, '')
    console.log(mes)
    GlobalEvent.emit('@app/logs', mes)
    callback(null)
  }
}

export class EventLogger extends ConsoleLogger {
  static SetOutput() {
    const wr = new EventStream()
    ConsoleLogger.SetConsole(new Console({
      colorMode: false,
      stdout: wr,
      stderr: wr
    }))
  }
}
