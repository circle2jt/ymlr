import { ElementShadow } from '../element-shadow'
import { ElementProps } from '../element.props'

/** |**  continue
  Ignore the next steps in the same parent
  @example
  ```yaml
    - group:
        title: group 1
        runs:
          - echo: 1             # => 1
          - continue:           # => Stop here then ignore the next steps in the same parent
          - echo: 2
          - echo: 3
    - group:                    # Still run the next group
        title: group 1
        runs:
          - echo: 2             # => 2
  ```
*/
export class Continue extends ElementShadow {
  constructor(props: ElementProps) {
    super()
    Object.assign(this, props)
  }

  async exec() { }
}
