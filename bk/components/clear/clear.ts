import { ElementShadow } from '../element-shadow'
import { ElementProps } from '../element.props'

/** |**  clear
  Clear console screen
  @order 6
  @example
  ```yaml
    - clear:
  ```
*/
export class Clear extends ElementShadow {
  constructor(props: ElementProps) {
    super()
    Object.assign(this, props)
  }

  async exec() {
    console.clear()
  }
}
