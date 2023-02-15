import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { Scene } from 'src/components/scene/scene'
import { Logger } from 'src/libs/logger'
import { GlobalEvent } from 'src/managers/events-manager'
import { TagsManager } from 'src/managers/tags-manager'
import { TemplatesManager } from 'src/managers/templates-manager'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { Element } from './element.interface'
import { SceneProps } from './scene/scene.props'

/** |** Root scene
Root scene file includes all of steps to run
@order 0
@position top
@tag It's a scene file
@example
```yaml
  name: Scene name                 # Scene name
  description: Scene description    # Scene description
  log: info                         # Show log when run. Default is info. [silent, error, warn, info, debug, trace, all]
  password:                         # Encrypted this file with the password. To run this file, need to provides a password in the command line
  vars:                             # Declare global variables which are used in the program.
    env: production                 # |- Only the variables which are declared at here just can be overrided by environment variables
  runs:                             # Defined all of steps which will be run in the scene
    - echo: Hello world
    - test: test props
```
*/
export class RootScene extends Scene {
  readonly tagsManager = new TagsManager(this)
  readonly templatesManager = new TemplatesManager()
  readonly globalUtils = new UtilityFunctionManager()
  readonly globalVars: Record<string, any> = {}
  readonly disposeApps = new Array<Element>()
  readonly runDir = process.cwd()
  rootDir = ''

  constructor(props: SceneProps, public logger: Logger) {
    super(props)
    this.$$ignoreEvalProps.push('globalUtils', 'tagsManager', 'globalVars', 'templatesManager', 'rootDir')
    this.isRoot = true
    this.scene = this.rootScene = this
  }

  async exec() {
    await this.asyncConstructor()
    GlobalEvent.emit('scene/exec:before')
    try {
      const rs = await super.exec()
      return rs
    } finally {
      GlobalEvent.emit('scene/exec:end')
    }
  }

  async dispose() {
    GlobalEvent.emit('scene/dispose:before')
    try {
      const proms = this.disposeApps.map(async elem => {
        if (elem.disposeApp !== undefined) {
          await elem.disposeApp()
        }
      })
      if (proms.length) {
        await Promise.all(proms)
      }
      await super.dispose()
    } finally {
      GlobalEvent.emit('scene/dispose:end')
    }
  }

  extend(tagName: string | undefined, baseProps: any, ids: string[] | string) {
    if (!ids?.length) return
    if (typeof ids === 'string') ids = [ids]
    ids.forEach(id => {
      let cached = this.templatesManager.getFromCached(id)
      if (!cached) {
        this.logger.warn(`Could not found element with id "${id}"`)
        cached = {
          skip: true
        }
      }
      cached = cloneDeep(cached)
      if (tagName && cached.template) {
        cached[tagName] = cached.template
        cached.template = undefined
      }
      baseProps = merge(cached, baseProps)
    })
    return baseProps
  }

  export(tagName: string | undefined, props: any, id: string) {
    if (!id) return
    const cached = cloneDeep(props)
    if (tagName && props.template) {
      props[tagName] = props.template
      props.template = undefined
    }
    this.templatesManager.pushToCached(id, cached)
    this.logger.trace('->    \t%s', id)
  }

  // private handleShutdown() {
  //   new Array('SIGINT', 'SIGTERM', 'SIGQUIT')
  //     .forEach(signal => process.once(signal, async () => {
  //       await this.dispose()
  //       process.exit(0)
  //     }))
  // }
}
