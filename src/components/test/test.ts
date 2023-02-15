import chalk from 'chalk'
import { ElementProps } from 'src/components/element.props'
import { ElementShadow } from '../element-shadow'
import { TestError } from './test-error'

export type TestProps = string | ({
  check?: string
  script?: string
} & ElementProps)

/** |**  test
  Check conditions in the program
  @example
  Quick test
  ```yaml
    - test:
        title: Number must be greater than 10
        check: ${vars.age > 10}

    - test: ${vars.age < 10}
  ```

  Test with nodejs script
  ```yaml
    - test:
        title: Number must be greater than 10
        script: |
          if (vars.age > 10) this.failed('Age is not valid')
  ```
*/
export class Test extends ElementShadow {
  $$ignoreEvalProps = ['script', 'defaultTestTitle']

  title?: string
  check?: string
  script?: string

  private readonly defaultTestTitle?: string

  constructor(props: TestProps) {
    super()
    if (typeof props === 'string') {
      props = {
        check: props
      }
    }
    Object.assign(this, props)
    if (!this.title) this.defaultTestTitle = this.check || this.script
  }

  failed(description = ''): never {
    this.error = new TestError(description)
    throw this.error
  }

  async exec() {
    try {
      if (this.check !== undefined) {
        const rs = this.check
        if (!rs) this.failed()
      }
      if (this.script) {
        try {
          await this.callFunctionScript(this.script)
        } catch (err: any) {
          this.failed(err?.message)
        }
      }
      this.title && this.logger.info(this.title)
    } catch (err: any) {
      if (err !== this.error) throw err
      this.logger.error('%s\t%s', this.title || this.defaultTestTitle, chalk.gray(this.error?.message))
    }
    return !this.error
  }
}
