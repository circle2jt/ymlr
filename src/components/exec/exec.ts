import assert from 'assert'
import { spawn, type SpawnOptions, type StdioOptions } from 'child_process'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type ExecProps } from './exec.props'

/** |**  exec
  Execute a program
  @example
  Execute a bash script
  ```yaml
    - name: Run a bash script
      exec:
        exitCodes: [0, 1] # expect exit code is 0, 1 is success
        commands:
          - /bin/sh
          - /startup.sh
        opts:
          cwd: /home/user/app
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
  get logger() { return this.proxy.logger }

  exitCodes = [0]
  opts?: SpawnOptions
  commands!: string[]

  private _abortController?: AbortController

  constructor(props: string[] | ExecProps) {
    if (Array.isArray(props)) {
      this.commands = props
    } else {
      Object.assign(this, props)
    }
  }

  async exec() {
    assert(this.commands?.length)
    const rs = await new Promise<{ code: number, signal: NodeJS.Signals, logs?: string }>((resolve, reject) => {
      this.logger.debug('› %s', this.commands.join(' '))
      let logs: string[] | undefined
      this._abortController = new AbortController()
      let stdio: StdioOptions = ['pipe', 'ignore', 'ignore']
      if (this.proxy.vars) {
        stdio = 'pipe'
        logs = []
      } else if (this.logger.is(LoggerLevel.trace)) {
        stdio = 'pipe'
      } else if (this.logger.is(LoggerLevel.error)) {
        stdio = ['pipe', 'ignore', 'pipe']
      }
      const [bin, ...args] = this.commands
      const c = spawn(bin, args, {
        stdio,
        env: process.env,
        cwd: this.proxy.scene?.curDir,
        signal: this._abortController.signal,
        ...this.opts
      })
      if (logs || this.logger.is(LoggerLevel.trace)) {
        c.stdout?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          this.logger.trace(msg)
        })
      }
      if (logs || this.logger.is(LoggerLevel.error)) {
        c.stderr?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          this.logger.error(msg)
        })
      }
      c.on('close', (code: number, signal: NodeJS.Signals) => {
        if (!this.exitCodes.includes(code)) {
          const err = new Error(`Error code ${code}, signal: ${signal}`)
          reject(err)
          return
        }
        resolve({ code, signal, logs: logs?.join('\n') })
      })
      c.on('error', reject)
    })
    return rs
  }

  dispose() {
    this._abortController?.abort()
  }
}
