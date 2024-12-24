import assert from 'assert'
import { exec, execFile, spawn, type ChildProcess, type ExecFileOptions, type SpawnOptionsWithoutStdio, type StdioOptions } from 'child_process'
import { FileRemote } from 'src/libs/file-remote'
import { FileTemp } from 'src/libs/file-temp'
import { formatTextToMs } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type ShProps } from './sh.props'

/** |**  sh
  Execute a bash script or shell file
  @example
  Execute a sh file
  ```yaml
    - name: Write a hello file
      sh:
        path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
        args:
          - world
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
        process: true                   # Create a new child process to execute a long task. Default is false
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
  args?: string[]

  timeout?: string | number
  process?: boolean
  bin: boolean | string = '/bin/sh'
  opts?: SpawnOptionsWithoutStdio | ExecFileOptions
  exitCodes = [0]
  plainExecuteLog?: boolean

  private _abortController?: AbortController
  private get _timeout() {
    return this.timeout ? formatTextToMs(this.timeout) : undefined
  }

  private _filePath?: string
  private _tempFile?: FileTemp

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
      const script = await fileRemote.getTextContent()
      assert(script)
      if (fileRemote.isRemote) {
        this._tempFile = new FileTemp()
        this._tempFile.create(script, {
          mode: 0o775,
          flag: 'w'
        })
        this._filePath = this._tempFile.file
      } else {
        this._filePath = fileRemote.uri
      }
    } else {
      assert(this.script)
    }

    if (this.timeout) {
      this.timeout = formatTextToMs(this.timeout)
    }
    this._abortController = new AbortController()
    if (this.process === true) {
      const rs = await this.execLongScript()
      return rs
    }
    const rs = await this.execShortScript()
    return rs
  }

  private async execLongScript() {
    const logger = this.plainExecuteLog ? this.logger.clone().plainLog() : this.logger
    return await new Promise((resolve, reject) => {
      let logs: string[] | undefined
      let stdio: StdioOptions = ['pipe', 'ignore', 'ignore']
      if (this.proxy.vars) {
        stdio = 'pipe'
        logs = []
      } else if (logger.is(LoggerLevel.trace)) {
        stdio = 'pipe'
      } else if (logger.is(LoggerLevel.error)) {
        stdio = ['pipe', 'ignore', 'pipe']
      }
      let c: ChildProcess
      const opts = {
        stdio,
        env: process.env,
        cwd: this.proxy.curDir,
        timeout: this._timeout,
        signal: this._abortController?.signal,
        ...this.opts
      }
      if (this.path) {
        c = spawn(this._filePath as string, this.args || [], opts)
      } else {
        c = spawn(this.script as string, {
          shell: this.bin,
          ...opts
        })
      }
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
      c.on('exit', (code, signal) => {
        this.logger.warn(`Exit code=${code}, signal=${signal}`)
      })
      c.on('close', (code: number) => {
        if (!this.exitCodes.includes(code)) {
          const err = new Error(logs?.join(''))
          err.cause = `Closed code=${code}`
          reject(err)
          return
        }
        resolve(logs?.join(''))
      })
      c.on('error', (err) => {
        this.logger.error(err)
      })
    })
  }

  private async execShortScript() {
    let c: ChildProcess | undefined
    let log: string | undefined
    try {
      const logger = this.plainExecuteLog ? this.logger.clone().plainLog() : this.logger
      log = await new Promise((resolve, reject) => {
        const cb = (err: any, stdout: string, stderr: string) => {
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
        }
        const opts = {
          env: process.env,
          cwd: this.proxy.curDir,
          timeout: this._timeout,
          signal: this._abortController?.signal,
          ...this.opts
        }
        if (this.path) {
          c = execFile(this._filePath as string, this.args || [], opts, cb)
        } else {
          c = exec(this.script as string, {
            shell: this.bin as any,
            ...opts
          }, cb)
        }
      })
    } catch (err) {
      if (!c?.exitCode || !this.exitCodes.includes(c.exitCode)) {
        throw err
      }
    }
    return log
  }

  dispose() {
    this._tempFile?.remove()
    this._abortController?.abort()
  }
}
