import merge from 'lodash.merge'
import { type AppEvent } from 'src/app-event'
import { GlobalEvent } from 'src/libs/global-event'
import { cloneDeep } from 'src/libs/variable'
import { TagsManager } from 'src/managers/tags-manager'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { WorkerManager } from 'src/managers/worker-manager'
import { type ElementProxy } from './element-proxy'
import { ElementBaseKeys, type Element } from './element.interface'
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
  envFiles:                         # Load env variable from files (string | string[])
    - .env
    - .env.dev
  varsFiles:                        # Load vars from json or yaml files (string | string[])
    - ./var1.json
    - ./var2.yaml
  runs:                             # Defined all of steps which will be run in the scene
    - echo: Hello world
    - test: test props
```
*/
export class RootScene extends Scene {
  override readonly isRootScene = true
  override readonly isScene = true
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

  #localVars!: Record<string, any>
  override set localVars(vars: Record<string, any>) {
    this.#localVars = vars
  }

  override get localVars() {
    if (!this.#localVars) {
      this.localVars = {}
    }
    return this.#localVars
  }

  protected override get rootScene() {
    return this
  }

  protected override get scene() {
    return this
  }

  constructor({ globalVars, ...props }: RootSceneProps) {
    super(props)
    if (globalVars) merge(this.localVars, globalVars)
    this.ignoreEvalProps.push('globalUtils', 'tagsManager', 'templatesManager', 'rootDir', 'onAppExit')
  }

  override async asyncConstructor() {
    await this.handleFile()
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

  getTagName(props: any) {
    const keys = Object.keys(props)
    let tagName: string | undefined
    for (let key of keys) {
      if (key.startsWith('~')) {
        const oldKey = key
        key = key.substring(1)
        props[key] = props[oldKey]
        props[oldKey] = undefined
        props.async = true
      }
      if (!ElementBaseKeys.includes(key) && props[key] !== undefined) {
        tagName = key
        break
      }
    }
    return tagName
  }

  export(tagName: string | undefined, props: any, id: string) {
    if (!id) return
    const { errorStack, ...cached } = cloneDeep(props)
    if (tagName && props.template) {
      props[tagName] = props.template
      props.template = undefined
    }
    this.templatesManager.set(id, cached)
    this.logger.trace('->    \t%s', id)
  }

  // protected async getRemoteFileProps() {
  //   const props = await super.getRemoteFileProps()
  //   if (props?.path) {
  //     const { env, ...sceneProps } = props
  //     return {
  //       env,
  //       runs: [{
  //         scene: sceneProps
  //       }]
  //     }
  //   }
  //   return props
  // }

  // private handleShutdown() {
  //   new Array('SIGINT', 'SIGTERM', 'SIGQUIT')
  //     .forEach(signal => process.once(signal, async () => {
  //       await this.dispose()
  //       process.exit(0)
  //     }))
  // }
}
