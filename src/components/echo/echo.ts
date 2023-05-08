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
    - echo: ${ $vars.name }
  ```

  Print text with custom type. (Follow "chalk")
  ```yaml
    - echo: Color is white

    - echo:
        styles: [red]
        content: Color is red
    - echo:
        styles: [red, bold]
        content: Content is red and bold
  ```
*/
export class Echo implements Element {
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  content: any
  styles?: string[]

  constructor(props: EchoProps) {
    if (typeof props !== 'object') {
      props = {
        content: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    this.logger.log(this.format())
    return this.content
  }

  private format() {
    let styles: Function = (msg: any) => msg
    if (this.styles?.length) {
      styles = this.styles
        .reduce((sum: any, method: string) => {
          sum = sum[method]
          return sum
        }, chalk)
    }
    if (typeof this.content === 'object') {
      return format(`${styles('%j')}`, this.content)
    }
    return styles(this.content?.toString())
  }

  dispose() { }
}
