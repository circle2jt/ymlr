import { RootScene } from 'src/components/root-scene'
import 'src/managers/modules-manager'
import { ElementProxy } from './components/element-proxy'
import { ElementClass } from './components/element.props'
import { Logger, LoggerLevel } from './libs/logger'

export class Testing {
  static rootScene: RootScene

  static get vars() {
    return this.rootScene.localVars
  }

  static get logger() {
    return this.rootScene.logger
  }

  static async reset() {
    await Testing.rootScene?.dispose()
    Testing.rootScene = new RootScene({ content: '[]' }, new Logger(LoggerLevel.SILENT))
    await Testing.rootScene.exec()
  }

  static async newElement<T extends ElementProxy>(ElementClazz: ElementClass, props = {}, baseProps = {}): Promise<T> {
    const elem = await this.rootScene.newElementProxy(ElementClazz, props, baseProps)
    return elem as T
  }
}

void Testing.reset()
