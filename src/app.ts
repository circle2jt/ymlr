import assert from 'assert'
import chalk from 'chalk'
import { RootScene } from 'src/components/root-scene'
import { Summary } from './analystic/summary'
import { ElementProxy } from './components/element-proxy'
import { type RootSceneProps } from './components/root-scene.props'
import { Logger } from './libs/logger'
import { LoggerLevel } from './libs/logger/logger-level'

export class App {
  private readonly rootSceneProxy: ElementProxy<RootScene>

  constructor(public logger: Logger, rootSceneProps: RootSceneProps) {
    assert(rootSceneProps.path, 'Scene file is required')
    this.rootSceneProxy = new ElementProxy(new RootScene(rootSceneProps))
    this.rootSceneProxy.scene = this.rootSceneProxy.rootScene = this.rootSceneProxy.element
    this.rootSceneProxy.logger = this.logger.clone('root-scene')
  }

  setDirTags(dirs: string[]) {
    this.logger.debug('External sources %j', dirs)
    this.rootSceneProxy.element.tagsManager.tagDirs = dirs
  }

  setTemplates(cached: any) {
    Object.keys(cached).forEach((key: string) => {
      this.rootSceneProxy.element.templatesManager.pushToCached(key, cached[key])
    })
  }

  async exec() {
    const summary = this.rootSceneProxy.logger.is(LoggerLevel.DEBUG) ? new Summary(this.rootSceneProxy) : undefined
    try {
      await this.rootSceneProxy.exec()
    } catch (err: any) {
      this.logger.error(`${err.message}\t${chalk.gray(err.cause || '')}`, LoggerLevel.ERROR)
      throw err
    } finally {
      await this.rootSceneProxy.dispose()
      summary?.print()
      Logger.Dispose()
    }
  }
}
