import { LoggerLevel } from 'src/libs/logger'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { TestError } from './test-error'

export type TestProps = string | {
  check?: string
  script?: string
}

/** |**  test
  Check conditions in the program
  @example
  Quick test
  ```yaml
    - test:
        title: Number must be greater than 10
        check: ${$vars.age > 10}

    - test: ${$vars.age < 10}
  ```

  Test with nodejs script
  ```yaml
    - test:
        title: Number must be greater than 10
        script: |
          if (vars.age > 10) this.$.failed('Age is not valid')
  ```
*/
export class Test implements Element {
  readonly hideName = true
  readonly ignoreEvalProps = ['script', 'defaultTestTitle']
  readonly proxy!: ElementProxy<this>
  private get logger() { return this.proxy.logger }

  check?: string
  script?: string

  private readonly defaultTestTitle?: string

  constructor(props: TestProps) {
    if (typeof props === 'string') {
      props = {
        check: props
      }
    }
    Object.assign(this, props)
    this.defaultTestTitle = this.check || this.script || ''
  }

  failed(description = ''): never {
    const err = new TestError(this.proxy.name)
    err.cause = description || this.defaultTestTitle
    throw err
  }

  async exec() {
    if (this.check !== undefined) {
      const rs = this.check
      if (!rs) this.failed('')
    }
    if (this.script) {
      try {
        await this.proxy.callFunctionScript(this.script)
      } catch (err: any) {
        this.failed(err?.message)
      }
    }
    this.proxy.name && this.logger.passed(this.proxy.name, LoggerLevel.INFO)
    return true
  }

  dispose() { }
}
