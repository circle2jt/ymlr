import chalk from 'chalk'
import { format } from 'util'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { EchoProps } from './echo.props'

/** |**  echo
  Print to console screen
  @order 5
  @example
  Print a message
  ```yaml
    - echo: Hello world

    - echo:
        if: ${true}
        content: Hello
  ```

  Print a variable
  ```yaml
    - vars:
        name: thanh
    - echo: ${$vars.name}
  ```

  Print text with custom type. (Follow "chalk")
  ```yaml
    - echo'red: Color is red
    - echo'yellow: Color is yellow
    - echo'gray: Color is gray
    - echo'blue: Color is blue
    - echo'cyan: Color is cyan
    - echo'green: Color is green
    - echo'magenta: Color is magenta
    - echo: Color is white

    - echo:
        style: red
        content: Color is red
    - echo:
        style: red.bold
        content: Content is red and bold
  ```
*/
export class Echo implements Element {
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  content: any
  style?: string

  constructor(props: EchoProps) {
    if (typeof props !== 'object') {
      props = {
        content: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    this.logger.info(this.format())
    return this.content
  }

  private format() {
    // @ts-expect-error
    const style: Function = this.style ? chalk[this.style] : (msg: string) => msg
    if (typeof this.content === 'object') {
      return format(`${style('%j')}`, this.content)
    }
    return style(this.content?.toString())
  }

  dispose() { }
}
