import assert from 'assert'
import { execFile, spawn, type ChildProcess, type ExecFileOptions, type SpawnOptionsWithoutStdio, type StdioOptions } from 'child_process'
import { FileRemote } from 'src/libs/file-remote'
import { FileTemp } from 'src/libs/file-temp'
import { formatTextToMs } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type ShProps } from './sh.props'

/** |**  sh
  Execute a shell script
  @example
  Execute a sh file
  ```yaml
    - name: Write a hello file
      sh:
        path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
      vars: log       # !optional
  ```

  Execute a bash script
  ```yaml
    - name: Write a hello file
      sh:
        exitCodes: [0, 1]               # expect exit code is 0, 1 is success. Default is [0]
        script: |                       # Shell script content
          touch hello.txt
          echo "Hello world" > /tmp/hello.txt
        bin: /bin/sh                    # !optional. Default use /bin/sh to run sh script
        timeout: 10m                    # Time to run before force quit
        process: true                   # Create a new child process to execute it. Default is false
        plainExecuteLog: true           # Not prepend timestamp, loglevel... in the execution log. Only native message
        opts:                           # Ref: "SpawnOptionsWithoutStdio", "ExecFileOptions" in nodeJS
          detached: true
          ...
      vars: log                         # !optional
  ```
*/
export class Sh implements Element {
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  script?: string
  path?: string
  timeout?: string | number
  process?: boolean
  bin = '/bin/sh'
  opts?: SpawnOptionsWithoutStdio | ExecFileOptions
  exitCodes = [0]
  plainExecuteLog?: boolean

  private _abortController?: AbortController

  constructor(props: ShProps) {
    if (typeof props === 'string') {
      props = {
        script: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    if (this.path) {
      const fileRemote = new FileRemote(this.path, this.proxy)
      this.script = await fileRemote.getTextContent()
    }
    assert(this.script)
    const tmpFile = new FileTemp()
    try {
      tmpFile.create(this.script)
      const timeout = this.timeout === undefined ? undefined : formatTextToMs(this.timeout)
      const rs = await (this.process === true ? this.execLongScript(tmpFile, timeout) : this.ShortScript(tmpFile, timeout))
      return rs
    } finally {
      this._abortController = undefined
      tmpFile.remove()
    }
  }

  private async execLongScript(tmpFile: FileTemp, timeout: number | undefined) {
    const logger = this.plainExecuteLog ? this.logger.clone().plainLog() : this.logger
    return await new Promise((resolve, reject) => {
      let logs: string[] | undefined
      this._abortController = new AbortController()
      let stdio: StdioOptions = ['pipe', 'ignore', 'ignore']
      if (this.proxy.vars) {
        stdio = 'pipe'
        logs = []
      } else if (logger.is(LoggerLevel.trace)) {
        stdio = 'pipe'
      } else if (logger.is(LoggerLevel.error)) {
        stdio = ['pipe', 'ignore', 'pipe']
      }
      const c = spawn(this.bin, [tmpFile.file], {
        stdio,
        env: process.env,
        cwd: this.proxy.curDir,
        timeout,
        signal: this._abortController.signal,
        ...this.opts
      })
      if (logs || logger.is(LoggerLevel.trace)) {
        c.stdout?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          logger.trace(msg)
        })
      }
      if (logs || logger.is(LoggerLevel.error)) {
        c.stderr?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          logger.error(msg)
        })
      }
      c.on('close', (code: number) => {
        if (!this.exitCodes.includes(code)) {
          const err = new Error(logs?.join(''))
          err.cause = `Exit code is ${code}`
          reject(err)
          return
        }
        resolve(logs?.join(''))
      })
      c.on('error', reject)
    })
  }

  private async ShortScript(tmpFile: FileTemp, timeout: number | undefined) {
    let proc: ChildProcess | undefined
    let log: string | undefined
    try {
      const logger = this.plainExecuteLog ? this.logger.clone().plainLog() : this.logger
      log = await new Promise((resolve, reject) => {
        this._abortController = new AbortController()
        proc = execFile(this.bin, [tmpFile.file], {
          env: process.env,
          cwd: this.proxy.curDir,
          timeout,
          signal: this._abortController.signal,
          ...this.opts
        }, (err, stdout, stderr) => {
          if (err) {
            reject(err)
            return
          }
          if (stdout && logger.is(LoggerLevel.trace)) {
            logger.trace(stdout)
          }
          if (stderr && logger.is(LoggerLevel.error)) {
            logger.error(stderr)
          }
          resolve(this.proxy.vars ? (stdout + '\r\n' + stderr).trim() : undefined)
        })
      })
    } catch (err) {
      if (!proc?.exitCode || !this.exitCodes.includes(proc.exitCode)) {
        throw err
      }
    }
    return log
  }

  dispose() {
    this._abortController?.abort()
  }
}
