import { Logger } from "src/libs/logger"
import { ElementProxy } from "./element-proxy"
import { RootScene } from "./root-scene"
import { Scene } from "./scene/scene"

export interface Element {
  proxy: ElementProxy<this>
  scene: Scene
  rootScene: RootScene
  parent: Element
  logger: Logger

  loopKey?: any
  loopValue?: any

  lazyInit?: (props?: any) => any
  init(props?: any): any
  exec(input?: any): any
  dispose(): any

}
