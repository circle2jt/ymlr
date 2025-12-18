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

  Execute a execuable file
  ```yaml
    - name: Write a hello file
      sh:
        path: ffmpeg
        args:
          - "--version"
      vars: log       # !optional
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

  private abortController?: AbortController
  private filePath?: string
  private tempFile?: FileTemp
  private childProcess?: ChildProcess
  private get timeoutMS() {
    return this.timeout ? formatTextToMs(this.timeout) : undefined
  }

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
      if (this.path.includes("/") || this.path.includes("\\")) {
        const fileRemote = new FileRemote(this.path, this.proxy)
        const script = await fileRemote.getTextContent()
        assert(script)
        if (fileRemote.isRemote) {
          this.tempFile = new FileTemp()
          this.tempFile.create(script, {
            mode: 0o775,
            flag: 'w'
          })
          this.filePath = this.tempFile.file
        } else {
          this.filePath = fileRemote.uri
        }
      } else {
        this.filePath = this.path
      }
    } else {
      assert(this.script)
    }

    if (this.timeout) {
      this.timeout = formatTextToMs(this.timeout)
    }
    this.abortController = new AbortController()
    try {
      if (this.process === true) {
        const rs = await this.execLongScript()
        return rs
      }
      const rs = await this.execShortScript()
      return rs
    } finally {
      this.childProcess = undefined
    }
  }

  private async execLongScript() {
    const logger = this.plainExecuteLog ? this.logger.clone().plainLog() : this.logger
    const rs = await new Promise((resolve, reject) => {
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
      const opts = {
        stdio,
        env: process.env,
        cwd: this.proxy.curDir,
        timeout: this.timeoutMS,
        signal: this.abortController?.signal,
        ...this.opts
      }
      if (this.path) {
        this.childProcess = spawn(this.filePath as string, this.args || [], opts)
      } else {
        this.childProcess = spawn(this.script as string, {
          shell: this.bin,
          ...opts
        })
      }
      if (logs || logger.is(LoggerLevel.trace)) {
        this.childProcess.stdout?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          logger.trace(msg)
        })
      }
      if (logs || logger.is(LoggerLevel.error)) {
        this.childProcess.stderr?.on('data', msg => {
          msg = msg.toString().replace(/\n$/, '')
          logs?.push(msg)
          logger.error(msg)
        })
      }
      this.childProcess.on('exit', (code, signal) => {
        if (code || signal) {
          this.logger.warn(`Exit code=${code}, signal=${signal}`)
        }
      })
      this.childProcess.on('close', (code: number) => {
        if (!this.exitCodes.includes(code)) {
          const err = new Error(logs?.join(''))
          err.cause = `Closed code=${code}`
          reject(err)
          return
        }
        resolve(logs?.join(''))
      })
      this.childProcess.on('error', (err) => {
        this.logger.error(err)
      })
    })
    return rs
  }

  private async execShortScript() {
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
          timeout: this.timeoutMS,
          signal: this.abortController?.signal,
          ...this.opts
        }
        if (this.path) {
          this.childProcess = execFile(this.filePath as string, this.args || [], opts, cb)
        } else {
          this.childProcess = exec(this.script as string, {
            shell: this.bin as any,
            ...opts
          }, cb)
        }
      })
    } catch (err) {
      if (!this.childProcess?.exitCode || !this.exitCodes.includes(this.childProcess.exitCode)) {
        throw err
      }
    }
    return log
  }

  dispose() {
    this.tempFile?.remove()
    this.abortController?.abort()
    this.childProcess?.kill()
  }
}
