import chalk from 'chalk'
import { format } from 'util'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type EchoProps } from './echo.props'
import { type Formater } from './formater'

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
export class Echo implements Element, Formater {
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
    let input = ''
    if (typeof this.content === 'object') {
      input = format('%j', this.content)
    } else {
      input = this.content?.toString()
    }
    this.logger.log(this.format(input))
    return this.content
  }

  format(input: string) {
    let styles = (msg: any) => msg
    if (this.styles?.length) {
      styles = this.styles
        .reduce((sum: any, method: string) => {
          sum = sum[method]
          return sum
        }, chalk)
    }
    return styles(input)
  }

  dispose() { }
}
