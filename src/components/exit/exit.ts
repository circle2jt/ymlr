import { ElementShadow } from '../element-shadow'
import { ExitProps } from './exit.props'

/** |**  exit
  Stop then quit the program
  @example
  ```yaml
    - exit: 0

    - exit:
        title: Throw error
        code: 1
  ```
*/
export class Exit extends ElementShadow {
  code?: number | string

  constructor(props: ExitProps) {
    super()
    if (typeof props === 'object') {
      Object.assign(this, props)
    } else {
      this.code = props as number | string
    }
  }

  async exec() {
    return this.exit()
  }

  exit() {
    const code = this.code !== undefined ? +this.code : 0
    process.exit(code || 0)
  }
}
