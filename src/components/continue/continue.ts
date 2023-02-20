import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'

/** |**  continue
  Ignore the next steps in the same parent
  @example
  ```yaml
    - name: group 1
      runs:
        - echo: 1             # => 1
        - continue:           # => Stop here then ignore the next steps in the same parent
        - echo: 2
        - echo: 3
    - name: group 1
      runs:                    # Still run the next group
        - echo: 2             # => 2
  ```
*/
export class Continue implements Element {
  readonly proxy!: ElementProxy<this>

  exec() { }

  dispose() { }
}
