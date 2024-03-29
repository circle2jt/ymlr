import assert from 'assert'
import chalk from 'chalk'
import { spawn } from 'child_process'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'

/** |**  exec
  Execute a program
  @example
  Execute a bash script
  ```yaml
    - name: Run a bash script
      exec:
        - /bin/sh
        - /startup.sh
  ```
  Execute a python app
  ```yaml
    - exec:
        - python
        - app.py
  ```
*/
export class Exec implements Element {
  readonly proxy!: ElementProxy<this>

  private get scene() { return this.proxy.scene }
  private get logger() { return this.proxy.logger }

  constructor(public commands: string[]) { }

  async exec() {
    assert(this.commands?.length)

    const rs = await new Promise<{ code: number, signal: NodeJS.Signals }>((resolve, reject) => {
      this.logger.debug('› %s', this.commands.join(' '))
      const [bin, ...args] = this.commands
      const c = spawn(bin, args, { env: process.env, cwd: this.scene?.curDir, stdio: this.logger.is(LoggerLevel.TRACE) ? 'pipe' : 'ignore' })
      c.stdout?.on('data', msg => {
        msg = msg.toString().replace(/\n$/, '')
        this.logger.trace(msg)
      })
      c.stderr?.on('data', msg => {
        msg = msg.toString().replace(/\n$/, '')
        this.logger.trace(chalk.yellow(msg))
      })
      c.on('close', (code: number, signal: NodeJS.Signals) => {
        if (signal) return reject(new Error(`Error code ${code}, signal: ${signal}`))
        resolve({ code, signal })
      })
      c.on('error', reject)
    })
    return rs
  }

  dispose() { }
}
