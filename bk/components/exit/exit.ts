import { ElementShadow } from '../element-shadow'

/** |**  exit
  Stop then quit the program
  @example
  ```yaml
    - exit: 0

    - name: Throw error
      exit: 1
  ```
*/
export class Exit extends ElementShadow {
  code: number

  constructor(props?: number) {
    super()
    this.code = +(props ?? 0)
  }

  async exec() {
    return this.exit()
  }

  exit() {
    process.exit(this.code)
  }
}
