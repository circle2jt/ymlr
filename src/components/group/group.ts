import { type AppEvent } from 'src/app-event'
import { DEBUG_GROUP_RESULT, OPTIMIZE_MODE, OptimizeMode } from 'src/env'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { cloneDeep } from 'src/libs/variable'
import { ElementProxy } from '../element-proxy'
import { ElementBaseKeys, type Element, type ElementBaseProps, type ElementClass } from '../element.interface'
import Include from '../include'
import { type RootScene } from '../root-scene'
import { type GroupItemProps, type GroupProps } from './group.props'

/** |**  runs
  Group elements
  @example
  ```yaml
    - name: Print all of message
      runs:
        - echo: hello
        - echo: world
        - name: Stop
          runs:
            - exit:
  ```
*/
export class Group<GP extends GroupProps, GIP extends GroupItemProps> implements Element {
  readonly ignoreEvalProps = ['runs']
  readonly proxy!: ElementProxy<this>

  protected runs: GIP[] = []
  protected get scene() { return this.proxy?.scene }
  protected get rootScene() { return this.proxy?.rootScene }
  protected get logger() { return this.proxy?.logger }
  protected get innerScene() {
    return this.scene
  }

  constructor(props: GP | GIP[]) {
    this.lazyInitRuns(props)
  }

  async dispose() { }

  lazyInitRuns(props: GP | GIP[]) {
    if (Array.isArray(props)) {
      props = {
        runs: props
      } as any
    }
    Object.assign(this, props)
    this.runs = this.runs?.filter(e => e) || []
  }

  private async newElement(nameOrClass: string | ElementClass, props: any) {
    let ElemClass: ElementClass
    if (typeof nameOrClass === 'string') {
      const name = nameOrClass
      ElemClass = await this.rootScene.tagsManager.loadElementClass(name, this.innerScene)
    } else {
      ElemClass = nameOrClass
    }
    const elem = new ElemClass(props)
    return elem
  }

  async newElementProxy<T extends Element>(nameOrClass: string | ElementClass, props: any, baseProps: any = {}, loopObj: any = {}) {
    const elem = await this.newElement(nameOrClass, props)
    const elemProxy = new ElementProxy(elem, baseProps) as ElementProxy<T>
    elemProxy.tag = typeof nameOrClass === 'string' ? nameOrClass : ((nameOrClass as any).tag || nameOrClass.name)
    elemProxy.parent = this
    elemProxy.scene = this.innerScene
    elemProxy.rootScene = (this.innerScene.isRoot ? this.innerScene : this.scene.rootScene) as RootScene
    Object.assign(elemProxy, loopObj)
    const elemImplementedAppEvent = elemProxy.$ as any as AppEvent
    if (typeof elemImplementedAppEvent.onAppExit === 'function') this.rootScene.onAppExit.push(elemImplementedAppEvent)

    if (Object.getOwnPropertyDescriptor(elem, 'innerRunsProxy')) {
      const innerRuns = await this.newElement(Group, props) as Group<GroupProps, GroupItemProps>
      const innerRunsProxy = new ElementProxy(innerRuns, baseProps)
      innerRunsProxy.tag = 'inner-group'
      innerRunsProxy.parent = elemProxy.parent
      innerRunsProxy.scene = elemProxy.scene
      innerRunsProxy.rootScene = elemProxy.rootScene
      const dispose = innerRunsProxy.dispose
      innerRunsProxy.dispose = async () => {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await dispose.bind(innerRunsProxy)
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await elemProxy.dispose()
      }
      // @ts-expect-error auto be injected by system
      elem.innerRunsProxy = innerRuns
      // @ts-expect-error auto init by system
      if (!elem.ignoreEvalProps) elem.ignoreEvalProps = []
      elem.ignoreEvalProps.push('innerRunsProxy', ...innerRuns.ignoreEvalProps)
    }
    return elemProxy
  }

  async exec(parentState?: Record<string, any>) {
    return await this.runEachOfElements(parentState)
  }

  private getTagName(props: any) {
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

  async runEachOfElements(parentState?: Record<string, any>) {
    const asyncJobs = new Array<Promise<any>>()
    const result = DEBUG_GROUP_RESULT ? new Array<ElementProxy<Element>>() : undefined

    if (OPTIMIZE_MODE === OptimizeMode.normal) {
      // Preload includes tag
      const includes = this.runs
        .map((e: any, i: number) => e.include ? { idx: i, include: e.include } : undefined)
        .filter(e => e)
      if (includes.length) {
        const runs = await Promise.all(includes
          .map(async (e: any) => {
            const elemProxy = await this.createAndExecuteElement(asyncJobs, 'include', parentState, {}, e.include)
            return { idx: e.idx, runs: elemProxy?.result || [] }
          })
        ) as Array<{ idx: number, runs: any[] }>
        for (let i = runs.length - 1; i >= 0; i--) {
          this.runs.splice(runs[i].idx, 1, ...runs[i].runs)
        }
      }
    }

    // Ignore skip tags
    this.runs = this.runs.filter(r => !r.skip)

    // Check tags which are picked to run then ignore others
    const hasRunOnly = this.runs.some(r => r.only === true)
    if (hasRunOnly) {
      this.runs = this.runs.filter(r => (r.only === true) || (r.template))
    }

    let isPassedCondition = false

    // Loop to execute each of tags
    for (let i = 0; i < this.runs.length; i++) {
      const allProps = cloneDeep(this.runs[i])

      if (isPassedCondition) {
        if (allProps.elseif || allProps.else === null) continue
        isPassedCondition = false
      }

      // Init props
      const props: any = allProps || {}
      if (props.runs || props['~runs']) {
        const runs = props.runs || props['~runs']
        props.async = !!props['~runs']
        props.group = {
          runs
        }
        props.runs = props['~runs'] = undefined
      }
      let { '<-': inheritKeys, '->': exposeKey, skip, only, ...eProps } = props
      let tagName = this.getTagName(eProps)
      const isTemplate = !!eProps.template

      // Only support template or tag name. Prefer tag name
      if (tagName && eProps.template) eProps.template = undefined

      if (inheritKeys) eProps = this.rootScene.extend(tagName, eProps, inheritKeys)
      if (exposeKey) this.rootScene.export(tagName, eProps, exposeKey)

      // Skip this if it's a template
      if (isTemplate) continue

      let { if: condition, elseif: elseIfCondition, else: elseCondition, force, debug, vars, async, detach, skipNext, loop, name, id, context } = eProps

      if (elseCondition === null) {
        elseIfCondition = true
      }

      // Retry to get tagName which is override by keys
      if (!tagName) {
        tagName = this.getTagName(eProps)
      }

      let elemProps: any
      if (tagName) {
        // This is a tag
        elemProps = eProps[tagName]
      } else {
        // This is a empty tag
        tagName = 'base'
        elemProps = undefined
      }
      if (debug === true) debug = LoggerLevel.DEBUG
      const baseProps: ElementBaseProps = {
        id,
        name,
        if: condition,
        elseif: elseIfCondition,
        force,
        debug,
        vars,
        detach,
        async,
        loop,
        context,
        skipNext
      }
      // Execute
      if (loop === undefined) {
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, elemProps)
        if (elemProxy?.$ instanceof Include) {
          // Preload includes tag
          let runs = elemProxy.result as GIP[]
          if (runs?.length) {
            // Ignore skip tags
            runs = runs.filter(r => !r.skip)
            // Check tags which are picked to run then ignore others
            const hasRunOnly = runs.some(r => r.only === true)
            if (hasRunOnly) {
              runs = runs.filter(r => (r.only === true) || (r.template))
            }
            this.runs.splice(i--, 1, ...runs)
          }
        } else if (elemProxy) {
          isPassedCondition = !!baseProps.if || !!baseProps.elseif
          result?.push(elemProxy)
          if (elemProxy.isSkipNext) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this.proxy)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; i++) {
              const newProps = (i === loopCondition.length - 1) ? elemProps : cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopKey: i,
                loopValue: loopCondition[i]
              })
              if (elemProxy) {
                result?.push(elemProxy)
              }
            }
          } else if (typeof loopCondition === 'object') {
            const keys = Object.keys(loopCondition)
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i]
              const newProps = (i === loopCondition.length - 1) ? elemProps : cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopKey: key,
                loopValue: loopCondition[key]
              })
              if (elemProxy) {
                result?.push(elemProxy)
              }
            }
          } else if (loopCondition === true) {
            while (loopCondition) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopValue: loopCondition
              })
              if (elemProxy) {
                result?.push(elemProxy)
              }
              loopCondition = await this.innerScene.getVars(loop, this.proxy)
            }
          }
        }
      }
    }
    if (asyncJobs.length) {
      await Promise.all(asyncJobs)
    }
    return result
  }

  private async createAndExecuteElement(asyncJobs: Array<Promise<any>>, name: string, parentState: any, baseProps: ElementBaseProps, props: any, loopObj: { loopKey?: any, loopValue?: any } = {}) {
    const elemProxy = await this.newElementProxy(name, props, baseProps, loopObj)
    elemProxy.parentState = parentState

    const condition = baseProps.elseif ?? baseProps.if
    const isContinue = (condition === undefined) || await this.innerScene.getVars(condition, elemProxy)
    if (!isContinue) return undefined

    if (elemProxy instanceof Include) {
      try {
        await elemProxy.exec(parentState)
      } finally {
        await elemProxy.dispose()
      }
    } else {
      if (baseProps.id) {
        await elemProxy.scene.setVars(baseProps.id, elemProxy)
      }
      const detach = baseProps.detach && await this.innerScene.getVars(baseProps.detach, elemProxy)
      if (detach) {
        this.rootScene.pushToBackgroundJob(elemProxy, parentState)
      } else {
        const async = baseProps.async && await this.innerScene.getVars(baseProps.async, elemProxy)
        if (async) {
          // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
          asyncJobs.push(new Promise<any>(async (resolve, reject) => {
            try {
              const rs = await elemProxy.exec(parentState)
              resolve(rs)
            } catch (err) {
              reject(err)
            } finally {
              await elemProxy.dispose()
            }
          }))
        } else {
          if (asyncJobs.length) {
            await Promise.all(asyncJobs)
            asyncJobs = []
          }
          try {
            await elemProxy.exec(parentState)
          } finally {
            await elemProxy.dispose()
          }
        }
      }
    }
    return elemProxy
  }
}
