import merge from 'lodash.merge'
import { type AppEvent } from 'src/app-event'
import { GlobalEvent } from 'src/libs/global-event'
import { cloneDeep } from 'src/libs/variable'
import { TagsManager } from 'src/managers/tags-manager'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { WorkerManager } from 'src/managers/worker-manager'
import { type ElementProxy } from './element-proxy'
import { type Element } from './element.interface'
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
  #workerManager?: WorkerManager
  get workerManager() {
    return this.#workerManager || (this.#workerManager = new WorkerManager(this.logger.clone('worker-manager')))
  }

  readonly #backgroundJobs = new Array<{ p: Promise<any>, ctx: ElementProxy<Element> }>()
  readonly tagsManager = new TagsManager(this)
  readonly templatesManager = new Map<string, any>()
  readonly globalUtils = UtilityFunctionManager.Instance
  readonly onAppExit = new Array<AppEvent>()
  readonly runDir = process.cwd()
  rootDir = ''

  constructor({ globalVars, ...props }: RootSceneProps) {
    super(props)
    if (globalVars) merge(this.localVars, globalVars)
    this.ignoreEvalProps.push('globalUtils', 'tagsManager', 'templatesManager', 'rootDir', '#workerManager', 'onAppExit', '#backgroundJobs', 'event')
  }

  override async asyncConstructor() {
    this.proxy.scene = this.proxy.rootScene = this
    await super.asyncConstructor()
  }

  pushToBackgroundJob(task: ElementProxy<Element>, parentState?: Record<string, any>) {
    this.#backgroundJobs.push({
      p: task.exec(parentState),
      ctx: task
    })
  }

  override async exec(parentState?: Record<string, any>) {
    const rs = await super.exec(parentState)
    await this.#workerManager?.exec()
    if (this.#backgroundJobs.length) {
      await Promise.all(this.#backgroundJobs.map(async ({ p, ctx }) => {
        try {
          await p
        } finally {
          await ctx.dispose()
        }
      }))
    }
    return rs
  }

  override async dispose() {
    const proms = [
      super.dispose()
    ]
    try {
      if (this.#workerManager) proms.push(this.#workerManager.dispose())
      if (this.onAppExit.length) proms.push(...this.onAppExit.map((elem: AppEvent) => elem.onAppExit()))
      await Promise.all(proms)
    } finally {
      GlobalEvent.removeAllListeners()
    }
  }

  extend(tagName: string | undefined, baseProps: any, ids: string[] | string) {
    if (!ids?.length) return
    if (typeof ids === 'string') ids = [ids]
    ids.forEach(id => {
      let cached = this.templatesManager.get(id)
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
    this.templatesManager.set(id, cached)
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
