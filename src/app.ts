import 'src/managers/modules-manager'

import assert from 'assert'
import chalk from 'chalk'
import { RootScene } from 'src/components/root-scene'
import { type Summary } from './analystic/summary'
import { ElementProxy } from './components/element-proxy'
import { type RootSceneProps } from './components/root-scene.props'
import { type Logger } from './libs/logger'
import { LoggerFactory } from './libs/logger/logger-factory'
import { LoggerLevel } from './libs/logger/logger-level'

export class App {
  static ProcessID = '#0'
  readonly #rootSceneProxy: ElementProxy<RootScene>

  constructor(public logger: Logger, rootSceneProps: RootSceneProps) {
    assert(rootSceneProps.path, 'Scene file is required')
    this.#rootSceneProxy = new ElementProxy(new RootScene(rootSceneProps))
    // this.#rootSceneProxy.scene = this.#rootSceneProxy.rootScene = this.#rootSceneProxy.element
    this.#rootSceneProxy.logger = this.logger.clone('root-scene')
  }

  setDirTags(dirs: string[]) {
    this.logger.debug('External sources %j', dirs)
    this.#rootSceneProxy.element.tagsManager.tagDirs = dirs
  }

  setTemplates(cached: Map<string, any>) {
    for (const [key, props] of cached.entries()) {
      this.#rootSceneProxy.element.templatesManager.set(key, props)
    }
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
      this.logger.error(`${err.message}\n${chalk.gray(err.cause || '')}\n${chalk.gray(err.proxyName || '')}`).trace(err)
      throw err
    } finally {
      await this.#rootSceneProxy.dispose()
      summary?.print()
      LoggerFactory.Dispose()
    }
  }
}
