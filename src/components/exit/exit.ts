import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

/** |**  exit
  Stop then quit the program
  @example
  ```yaml
    - exit: 0

    - name: Throw error
      exit: 1
  ```
*/
export class Exit implements Element {
  readonly proxy!: ElementProxy<this>

  constructor(public code?: number | string) { }

  async exec() {
    const code = +(this.code ?? 0)
    assert(!isNaN(code))
    this.exit(code)
    return code
  }

  exit(code: number) {
    process.exit(code)
  }

  dispose() { }
}
