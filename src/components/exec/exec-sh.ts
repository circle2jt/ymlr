import assert from 'assert'
import chalk from 'chalk'
import { execFile } from 'child_process'
import { FileRemote } from 'src/libs/file-remote'
import { FileTemp } from 'src/libs/file-temp'
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
        bin: /bin/sh    # !optional. Default use /bin/sh to run sh script
      vars: log       # !optional
  ```
*/
export class ExecSh implements Element {
  readonly proxy!: ElementProxy<this>

  private get scene() { return this.proxy.scene }
  private get logger() { return this.proxy.logger }

  script?: string
  path?: string
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
      await tmpFile.create(this.script)
      const rs = await new Promise((resolve, reject) => {
        execFile(this.bin, [tmpFile.file], { env: process.env, cwd: this.scene.curDir }, (err, stdout, stderr) => {
          if (err) return reject(err)
          stdout && this.logger.debug(chalk.gray(stdout))
          stderr && this.logger.debug(chalk.red(stderr))
          resolve((stdout + '\r\n' + stderr).trim())
        })
      })
      return rs
    } finally {
      tmpFile.remove()
    }
  }

  dispose() { }
}
