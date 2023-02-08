import { RootScene } from 'src/components/root-scene'
import 'src/managers/modules-manager'
import { ElementClass, ElementShadow } from './components/element-shadow'
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
    Testing.rootScene = new RootScene({ content: '[]' }, new Logger(Logger.LogLevel = LoggerLevel.SILENT))
    await Testing.rootScene.exec()
  }

  static async newElement<T extends ElementShadow>(ElementClazz: ElementClass, props?: any): Promise<T> {
    const elem = await this.rootScene.newElement(ElementClazz, props)
    return elem as T
  }
}

void Testing.reset()
