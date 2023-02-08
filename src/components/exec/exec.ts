import chalk from 'chalk'
import { spawn } from 'child_process'
import { LoggerLevel } from 'src/libs/logger'
import { ElementShadow } from '../element-shadow'
import { ExecProps } from './exec.props'

/** |**  exec
  Execute a program
  @example
  Execute a bash script
  ```yaml
    - exec:
        title: Run a bash script
        commands:
          - /bin/sh
          - /startup.sh
  ```
  Execute a python app
  ```yaml
    - exec:
        title: Run a python app
        commands:
          - python
          - app.py
  ```
*/
export class Exec extends ElementShadow {
  commands: string[] = []

  constructor(props: ExecProps) {
    super()
    if (Array.isArray(props)) {
      props = {
        commands: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    const rs = await new Promise<{ code: number, signal: NodeJS.Signals }>((resolve, reject) => {
      this.logger.debug('› %s', this.commands.join(' '))
      const [bin, ...args] = this.commands
      const c = spawn(bin, args, { env: process.env, cwd: this.scene.curDir, stdio: this.logger.is(LoggerLevel.TRACE) ? 'pipe' : 'ignore' })
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
}
