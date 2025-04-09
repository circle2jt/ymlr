import assert from 'assert'
import { RootScene } from 'src/components/root-scene'
import { type Summary } from './analystic/summary'
import { ElementProxy } from './components/element-proxy'
import { type RootSceneProps } from './components/root-scene.props'
import { type Logger } from './libs/logger'
import { LoggerFactory } from './libs/logger/logger-factory'
import { LoggerLevel } from './libs/logger/logger-level'

export class App {
  static ThreadID = '#0'
  readonly #rootSceneProxy: ElementProxy<RootScene>

  constructor(public logger: Logger, rootSceneProps: RootSceneProps) {
    assert(rootSceneProps.path, 'Scene file is required')
    this.#rootSceneProxy = new ElementProxy(new RootScene(rootSceneProps), { tag: 'root-scene', _logger: this.logger })
    Object.defineProperties(this.#rootSceneProxy, {
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
    // this.#rootSceneProxy.scene = this.#rootSceneProxy.rootScene = this.#rootSceneProxy.element
  }

  setDirTags(dirs: string[]) {
    this.logger.debug('External sources %j', dirs)
    this.#rootSceneProxy.element.tagsManager.tagDirs = dirs
  }

  setTemplates(cached: Record<string, any>) {
    Object.assign(this.#rootSceneProxy.element.templatesManager, cached)
  }

  async exec() {
    let summary: Summary | undefined
    const asyncConstructor = this.#rootSceneProxy.$.asyncConstructor
    this.#rootSceneProxy.$.asyncConstructor = async function () {
      await asyncConstructor.call(this)
      if (this.proxy.logger.is(LoggerLevel.debug)) {
        const { Summary } = await import('./analystic/summary')
        summary = new Summary(this.proxy)
      }
    }
    try {
      await this.#rootSceneProxy.exec()
    } catch (err: any) {
      this.logger.fatal(err)
      setImmediate(process.exit, 1)
    } finally {
      await this.#rootSceneProxy.dispose()
      summary?.print()
      LoggerFactory.Dispose()
    }
  }
}
