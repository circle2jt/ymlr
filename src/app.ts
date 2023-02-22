import assert from 'assert'
import { RootScene } from 'src/components/root-scene'
import { Summary } from './analystic/summary'
import { ElementProxy } from './components/element-proxy'
import { RootSceneProps } from './components/root-scene.props'
import { Logger } from './libs/logger'

export class App {
  private readonly rootScene: ElementProxy<RootScene>
  private readonly summary: Summary

  constructor(public logger: Logger, rootSceneProps: RootSceneProps) {
    assert(rootSceneProps.path, 'Scene file is required')
    this.rootScene = new ElementProxy(new RootScene(rootSceneProps))
    this.rootScene.scene = this.rootScene.rootScene = this.rootScene.element
    this.rootScene.logger = this.logger.clone('root-scene')
    this.summary = new Summary(this.rootScene.logger)
  }

  setDirTags(dirs: string[]) {
    this.logger.debug('External sources %j', dirs)
    this.rootScene.element.tagsManager.tagDirs = dirs
  }

  async exec() {
    try {
      await this.rootScene.exec()
    } finally {
      await this.rootScene.dispose()
      this.summary.print()
    }
  }
}
