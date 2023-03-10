import assert from 'assert'
import chalk from 'chalk'
import { RootScene } from 'src/components/root-scene'
import { name, version } from '../package.json'
import { Summary } from './analystic/summary'
import { ElementProxy } from './components/element-proxy'
import { Logger } from './libs/logger'

export class App {
  private readonly rootScene: ElementProxy<RootScene>
  private readonly summary: Summary

  constructor(public logger: Logger, private readonly file: string, private readonly password?: string) {
    this.logger.log('%s\t%s', chalk.yellow(`${name} 🚀`), chalk.gray(`${version}`))
    this.logger.log('')
    assert(this.file, 'Scene file is required')
    this.rootScene = new ElementProxy(new RootScene({ path: this.file, password: this.password }))
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
