import { Logger } from 'src/libs/logger'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { RootScene } from '../root-scene'
import { Scene } from '../scene/scene'
import { VarsProps } from './vars.props'

/** |**  vars
  Declare and set value to variables to reused in the scene/global scope
  - If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
  - If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene
  @example
  A main scene file
  ```yaml
    - vars:
        MainName: global var      # Is used in all of scenes
        mainName: local var       # Only used in this scene

    - scene:
        path: ./child.scene.yaml

    - echo: ${vars.MainName}      # => global var
    - echo: ${vars.mainName}      # => local var
    - echo: ${vars.name}          # => undefined
    - echo: ${vars.Name}          # => global name here
  ```
  A scene file `child.scene.yaml` is:
  ```yaml
    - vars:
        Name: global name here
        name: scene name here     # Only used in this scene

    - echo: ${vars.MainName}      # => global var
    - echo: ${vars.mainName}      # => undefined
    - echo: ${vars.name}          # => scene name here
    - echo: ${vars.Name}          # => global name here
  ```
*/
export class Vars implements Element {
  proxy!: ElementProxy<this>
  scene!: Scene
  rootScene!: RootScene
  parent!: Element
  logger!: Logger

  props: any

  init(props: VarsProps) {
    this.proxy.$$ignoreEvalProps.push('props')
    this.props = props
  }

  async exec() {
    const props = await this.scene.getVars(this.props, this)
    this.logger.trace('[%s] \t%j', this.proxy.$$tag, props)
    if (!props || Array.isArray(props) || typeof props !== 'object') return
    this.scene.mergeVars(props)

    return props
  }

  dispose() { }
}
