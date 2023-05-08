import 'src/managers/modules-manager'

import { RootScene } from 'src/components/root-scene'
import { ElementProxy } from './components/element-proxy'
import { Element, ElementClass } from './components/element.interface'
import { Logger } from './libs/logger'
import { LoggerLevel } from './libs/logger/logger-level'

export class Testing {
  static rootScene: RootScene
  static get rootSceneProxy() {
    return this.rootScene?.proxy
  }

  static get vars() {
    return Testing.rootScene.localVars
  }

  static get logger() {
    return Testing.rootSceneProxy.logger
  }

  static async reset(content = '[]') {
    const proxy = new ElementProxy(new RootScene({ content }))
    proxy.logger = new Logger(LoggerLevel.SILENT)
    Testing.rootScene = proxy.scene = proxy.rootScene = proxy.element
    await proxy.exec()
  }

  static async createElementProxy<T extends Element>(ElementClazz: ElementClass, props?: any, baseProps?: any) {
    const proxy = await this.rootScene.newElementProxy(ElementClazz, props, baseProps)
    return proxy as ElementProxy<T>
  }
}
