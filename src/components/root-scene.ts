import EventEmitter from 'events'
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { AppEvent } from 'src/app-event'
import { TagsManager } from 'src/managers/tags-manager'
import { TemplatesManager } from 'src/managers/templates-manager'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { WorkerManager } from 'src/managers/worker-manager'
import { RootSceneProps } from './root-scene.props'
import { Scene } from './scene/scene'

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
  private _workerManager?: WorkerManager
  get workerManager() {
    return this._workerManager || (this._workerManager = new WorkerManager(this.logger.clone('worker-manager')))
  }

  readonly tagsManager = new TagsManager(this)
  readonly templatesManager = new TemplatesManager()
  readonly globalUtils = new UtilityFunctionManager()
  readonly onAppExit = new Array<AppEvent>()
  readonly event = new EventEmitter({ captureRejections: false })
  readonly runDir = process.cwd()
  rootDir = ''

  constructor({ globalVars, ...props }: RootSceneProps) {
    super(props)
    this.isRoot = true
    this.scope = 'local'
    this.localVars = {}
    if (globalVars) merge(this.localVars, globalVars)
    this.ignoreEvalProps.push('globalUtils', 'tagsManager', 'templatesManager', 'rootDir', '_workerManager')
    this.event.setMaxListeners(0)
  }

  async asyncConstructor() {
    this.proxy.scene = this.proxy.rootScene = this
    await super.asyncConstructor()
  }

  async exec() {
    this.event.emit('scene/exec:before')
    try {
      const rs = await super.exec()
      await this._workerManager?.exec()
      return rs
    } finally {
      this.event.emit('scene/exec:end')
    }
  }

  async dispose() {
    const proms = []
    this.event.emit('scene/dispose:before')
    try {
      proms.push(super.dispose())
      if (this._workerManager) proms.push(this._workerManager.dispose())
      if (this.onAppExit.length) proms.push(...this.onAppExit.map((elem: AppEvent) => elem.onAppExit()))
      await Promise.all(proms)
    } finally {
      this.event.emit('scene/dispose:end')
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
