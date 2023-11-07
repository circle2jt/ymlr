import { Console } from 'console'
import { createWriteStream } from 'fs'
import { ConsoleLogger } from '../console'

export class FileLogger extends ConsoleLogger {
  static SetOutput(stdout: string, stderr?: string) {
    ConsoleLogger.SetConsole(new Console({
      colorMode: false,
      stdout: createWriteStream(stdout, { flags: 'a' }),
      stderr: stderr ? createWriteStream(stderr, { flags: 'a' }) : undefined
    }))
  }
}
