import assert from 'assert'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type JsProps } from './js.props'

/** |**  js
  Execute a nodejs code
  @example
  Set value to a variable
  ```yaml
    - name: Set value to a variable
      js: |
        vars.name = 'thanh'
        logger.info(vars.name)
  ```

  Write a file
  ```yaml
    - name: Write a file
      js:
        path: /sayHello.sh              # Path of js file (Use only "path" OR "script")
        script: |                       # NodeJS content
          const { writeFileSync } = require('fs')
          writeFileSync('/tmp/hello.txt', 'Hello world')
          return "OK"
      vars: result                      # !optional
  ```
*/
export class Js implements Element {
  readonly ignoreEvalProps = ['script']
  readonly proxy!: ElementProxy<this>

  private get scene() { return this.proxy.scene }

  script?: string
  path?: string

  constructor(props: JsProps) {
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
