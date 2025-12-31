import assert from 'assert'
import { RootScene } from 'src/components/root-scene'
import { ElementProxy } from './components/element-proxy'
import { type RootSceneProps } from './components/root-scene.props'
import { type Logger } from './libs/logger'
import { LoggerFactory } from './libs/logger/logger-factory'

export class App {
  static ThreadID = 'main'
  private readonly rootSceneProxy: ElementProxy<RootScene>

  constructor(public logger: Logger, rootSceneProps: RootSceneProps) {
    assert(rootSceneProps.path, 'Scene file is required')
    ElementProxy.DEBUG_LIFE_CIRCLE = true
    this.rootSceneProxy = new ElementProxy(new RootScene(rootSceneProps), { tag: 'root-scene', _logger: this.logger })
    Object.defineProperties(this.rootSceneProxy, {
      rootSceneProxy: {
        get() {
          return this
        }
      },
      rootScene: {
        get() {
          return this.$
        }
      },
      scene: {
        get() {
          return this.$
        }
      }
    })
    // this.rootSceneProxy.scene = this.rootSceneProxy.rootScene = this.rootSceneProxy.element
  }

  setDirTags(dirs: string[]) {
    this.logger.debug('External sources %j', dirs)
    this.rootSceneProxy.element.tagsManager.tagDirs = dirs
  }

  setTemplates(cached: Record<string, any>) {
    Object.assign(this.rootSceneProxy.element.templatesManager, cached)
  }

  async exec() {
    const asyncConstructor = this.rootSceneProxy.$.asyncConstructor
    this.rootSceneProxy.$.asyncConstructor = async function () {
      await asyncConstructor.call(this)
    }
    try {
      await this.rootSceneProxy.exec()
    } catch (err: any) {
      this.logger.fatal(err)
      setImmediate(process.exit, 1)
    } finally {
      await this.rootSceneProxy.dispose()
      LoggerFactory.Dispose()
    }
  }
}
