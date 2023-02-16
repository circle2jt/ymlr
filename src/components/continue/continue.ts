import { Logger } from 'src/libs/logger'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { RootScene } from '../root-scene'
import { Scene } from '../scene/scene'

/** |**  continue
  Ignore the next steps in the same parent
  @example
  ```yaml
    - name: group 1
      group:
        runs:
          - echo: 1             # => 1
          - continue:           # => Stop here then ignore the next steps in the same parent
          - echo: 2
          - echo: 3
    - name: group 1
      group:                    # Still run the next group
        runs:
          - echo: 2             # => 2
  ```
*/
export class Continue implements Element {
  proxy!: ElementProxy<this>
  scene!: Scene
  rootScene!: RootScene
  parent!: Element
  logger!: Logger

  init() { }

  exec() { }

  dispose() { }

}
