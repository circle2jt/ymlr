import assert from 'assert'
import { FileRemote } from 'src/libs/file-remote'
import { Logger } from 'src/libs/logger'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { RootScene } from '../root-scene'
import { Scene } from '../scene/scene'
import { ExecJsProps } from './exec-js.props'

/** |**  exec'js
  Execute a nodejs code
  @example
  Set value to a variable
  ```yaml
    - name: Set value to a variable
      exec'js: |
        vars.name = 'thanh'
        logger.info(vars.name)
  ```

  Write a file
  ```yaml
    - name: Write a file
      exec'js:
        path: /sayHello.sh              # Path of js file (Use only "path" OR "script")
        script: |                       # NodeJS content
          const { writeFileSync } = require('fs')
          writeFileSync('/tmp/hello.txt', 'Hello world')
          return "OK"
      vars: result                      # !optional
  ```
*/
export class ExecJs implements Element {
  proxy!: ElementProxy<this>
  scene!: Scene
  rootScene!: RootScene
  parent!: Element
  logger!: Logger

  script?: string
  path?: string

  init(props: ExecJsProps) {
    this.proxy.$$ignoreEvalProps.push('script')

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
    const rs = await this.proxy.callFunctionScript(this.script)
    return rs
  }

  dispose() { }
}
