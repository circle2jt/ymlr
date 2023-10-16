import EventEmitter from 'events'
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { type AppEvent } from 'src/app-event'
import { TagsManager } from 'src/managers/tags-manager'
import { TemplatesManager } from 'src/managers/templates-manager'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { WorkerManager } from 'src/managers/worker-manager'
import { ElementProxy } from './element-proxy'
import { Element } from './element.interface'
import { type RootSceneProps } from './root-scene.props'
import { Scene } from './scene/scene'

/** |** Root scene
Root scene file includes all of steps to run
@order 0
@position top
@tag It's a scene file
@example
```yaml
  name: Scene name                  # Scene name
  description: Scene description    # Scene description
  log: info                         # Show log when run. Default is info. [silent, error, warn, info, debug, trace, all]
  password:                         # Encrypted this file with the password. To run this file, need to provides a password in the command line
  vars:                             # Declare global variables which are used in the program.
    env: production                 # |- Only the variables which are declared in the top of root scene just can be overrided by environment variables
  env:                              # Set value to environment variable (process.env)
    DEBUG: all
    DEBUG_CONTEXTS: test=debug
    NODE_ENV: production
    env: dev                        # It overrides to $vars.env
    # - NODE_ENV=production
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

  private readonly _backgroundJobs = new Array<ElementProxy<Element>>()

  readonly tagsManager = new TagsManager(this)
  readonly templatesManager = new TemplatesManager()
  readonly globalUtils = new UtilityFunctionManager()
  readonly onAppExit = new Array<AppEvent>()
  readonly runDir = process.cwd()
  readonly event = new EventEmitter({ captureRejections: false }).setMaxListeners(0)
  rootDir = ''

  constructor({ globalVars, ...props }: RootSceneProps) {
    super(props)
    this.isRoot = true
    if (globalVars) merge(this.localVars, globalVars)
    this.ignoreEvalProps.push('globalUtils', 'tagsManager', 'templatesManager', 'rootDir', '_workerManager')
  }

  override async asyncConstructor() {
    this.proxy.scene = this.proxy.rootScene = this
    await super.asyncConstructor()
  }

  pushToBackgroundJob(task: ElementProxy<Element>) {
    this._backgroundJobs.push(task)
  }

  override async exec() {
    this.event.emit('scene/exec:before')
    try {
      const rs = await super.exec()
      await this._workerManager?.exec()
      if (this._backgroundJobs.length) {
        await Promise.all(this._backgroundJobs.map(job => job.dispose()))
      }
      return rs
    } finally {
      this.event.emit('scene/exec:end')
    }
  }

  override async dispose() {
    const proms = []
    this.event.emit('scene/dispose:before')
    try {
      proms.push(super.dispose())
      if (this._workerManager) proms.push(this._workerManager.dispose())
      if (this.onAppExit.length) proms.push(...this.onAppExit.map((elem: AppEvent) => elem.onAppExit()))
      await Promise.all(proms)
    } finally {
      this.event.emit('scene/dispose:end')
      this.event.removeAllListeners()
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
