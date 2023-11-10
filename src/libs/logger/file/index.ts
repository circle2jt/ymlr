import { Console } from 'console'
import { createWriteStream } from 'fs'
import { ConsoleLogger } from '../console'

export class FileLogger extends ConsoleLogger {
  static SetOutput(opts: { stdout: string, stderr?: string }) {
    ConsoleLogger.SetConsole(new Console({
      colorMode: false,
      stdout: createWriteStream(opts.stdout, { flags: 'a' }),
      stderr: opts.stderr ? createWriteStream(opts.stderr, { flags: 'a' }) : undefined
    }))
  }
}
