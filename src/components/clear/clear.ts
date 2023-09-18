import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

/** |**  clear
  Clear console screen
  @order 6
  @example
  ```yaml
    - clear:
  ```
*/
export class Clear implements Element {
  readonly proxy!: ElementProxy<this>

  async exec() {
    console.clear()
  }

  dispose() { }
}
