import { Logger } from 'src/libs/logger'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { RootScene } from '../root-scene'
import { Scene } from '../scene/scene'

export default class Base implements Element {
  proxy!: ElementProxy<this>
  scene!: Scene
  rootScene!: RootScene
  parent!: Element
  logger!: Logger

  props: any

  init(props?: any) {
    this.props = props
  }


  async exec() {
    return this.props
  }

  dispose() { }
}
