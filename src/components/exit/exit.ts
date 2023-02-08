import { ElementShadow } from '../element-shadow'
import { ElementProps } from '../element.props'

/** |**  exit
  Stop then quit the program
  @example
  ```yaml
    - exit:
  ```
*/
export class Exit extends ElementShadow {
  constructor(props: ElementProps) {
    super()
    Object.assign(this, props)
  }

  async exec() {
    return this.exit()
  }

  exit() {
    process.exit(1)
  }
}
