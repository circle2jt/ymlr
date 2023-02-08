import assert from 'assert'
import { FileRemote } from 'src/libs/file-remote'
import { ElementShadow } from '../element-shadow'
import { ExecJsProps } from './exec-js.props'

/** |**  exec'js
  Execute a nodejs code
  @example
  Set value to a variable
  ```yaml
    - exec'js:
        title: Set value to a variable
        script: |
          vars.name = 'thanh'
          logger.info(vars.name)
  ```

  Write a file
  ```yaml
    - exec'js:
        title: Write a file
        path: /sayHello.sh              # Path of js file (Use only "path" OR "script")
        script: |                       # NodeJS content
          const { writeFileSync } = require('fs')
          writeFileSync('/tmp/hello.txt', 'Hello world')
          return "OK"
        vars: result    # !optional
  ```
*/
export class ExecJs extends ElementShadow {
  $$ignoreEvalProps = ['script']

  script?: string
  path?: string

  constructor(props: ExecJsProps) {
    super()
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
    const rs = await this.callFunctionScript(this.script)
    return rs
  }
}
