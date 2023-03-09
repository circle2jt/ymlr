import assert from 'assert'
import chalk from 'chalk'
import { execFile, spawn } from 'child_process'
import { FileRemote } from 'src/libs/file-remote'
import { FileTemp } from 'src/libs/file-temp'
import { formatTextToMs } from 'src/libs/format'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { ExecShProps } from './exec-sh.props'

/** |**  exec'sh
  Execute a shell script
  @example
  Execute a sh file
  ```yaml
    - name: Write a hello file
      exec'sh:
        path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
      vars: log       # !optional
  ```

  Execute a bash script
  ```yaml
    - name: Write a hello file
      exec'sh:
        script: |                       # Shell script content
          touch hello.txt
          echo "Hello world" > /tmp/hello.txt
        bin: /bin/sh                    # !optional. Default use /bin/sh to run sh script
        timeout: 10m                    # Time to run before force quit
        process: true                   # Create a new child process to execute it. Default is false
      vars: log                         # !optional
  ```
*/
export class ExecSh implements Element {
  readonly proxy!: ElementProxy<this>

  private get scene() { return this.proxy.scene }
  private get logger() { return this.proxy.logger }

  script?: string
  path?: string
  timeout?: string | number
  process?: boolean
  bin = '/bin/sh'

  constructor(props: ExecShProps) {
    if (typeof props === 'string') {
      props = {
        script: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    if (this.path) {
      const fileRemote = new FileRemote(this.path, this.scene)
      this.script = await fileRemote.getTextContent()
    }
    assert(this.script)
    const tmpFile = new FileTemp()
    try {
      tmpFile.create(this.script)
      const timeout = this.timeout === undefined ? undefined : formatTextToMs(this.timeout)
      const rs = await (this.process === true ? this.execLongScript(tmpFile, timeout) : this.execShortScript(tmpFile, timeout))
      return rs
    } finally {
      tmpFile.remove()
    }
  }

  private async execLongScript(tmpFile: FileTemp, timeout: number | undefined) {
    return await new Promise((resolve, reject) => {
      const logs: string[] = []
      const c = spawn(this.bin, [tmpFile.file], { env: process.env, cwd: this.scene?.curDir, timeout })
      c.stdout?.on('data', msg => {
        msg = msg.toString()
        logs.push(msg)
        this.logger.debug(msg)
      })
      c.stderr?.on('data', msg => {
        msg = msg.toString()
        logs.push(msg)
        this.logger.debug(chalk.red(msg))
      })
      c.on('close', (code: number) => {
        if (code) return reject(new Error(logs.join('')))
        resolve(logs.join(''))
      })
      c.on('error', reject)
    })
  }

  private async execShortScript(tmpFile: FileTemp, timeout: number | undefined) {
    return await new Promise((resolve, reject) => {
      execFile(this.bin, [tmpFile.file], { env: process.env, cwd: this.scene.curDir, timeout }, (err, stdout, stderr) => {
        if (err) return reject(err)
        stdout && this.logger.debug(chalk.gray(stdout))
        stderr && this.logger.debug(chalk.red(stderr))
        resolve((stdout + '\r\n' + stderr).trim())
      })
    })
  }

  dispose() { }
}
