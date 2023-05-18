import cloneDeep from 'lodash.clonedeep'
import { AppEvent } from 'src/app-event'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { Continue } from '../continue/continue'
import { ElementProxy } from '../element-proxy'
import { Element, ElementBaseKeys, ElementBaseProps, ElementClass } from '../element.interface'
import { RootScene } from '../root-scene'
import { GroupItemProps, GroupProps } from './group.props'

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
  protected get scene() { return this.proxy.scene }
  protected get rootScene() { return this.proxy.rootScene }
  protected get logger() { return this.proxy.logger }
  protected get innerScene() {
    return this.scene
  }

  constructor(props: GP | GIP[]) {
    this.lazyInitRuns(props)
  }

  dispose() { }

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
    if (typeof nameOrClass === 'string') {
      const name = nameOrClass
      const ElemClass: ElementClass = await this.rootScene.tagsManager.loadElementClass(name, this.innerScene)
      return new ElemClass(props)
    }
    const ElemClass = nameOrClass
    return new ElemClass(props)
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
    return elemProxy
  }

  async exec(parentState?: Record<string, any>) {
    return await this.runEachOfElements(parentState)
  }

  private getTagName(props: any) {
    const keys = Object.keys(props)
    return keys.find(key => !ElementBaseKeys.includes(key) && props[key] !== undefined)
  }

  async runEachOfElements(parentState?: Record<string, any>) {
    const asyncJobs = new Array<Promise<any>>()
    const result = new Array<ElementProxy<Element>>()
    let newRuns = cloneDeep(this.runs)
    // Handle includes tag
    const includes = newRuns.map((e: any, i) => {
      if (!e.include) return undefined
      return { idx: i, file: e.include }
    }).filter(e => e) as Array<{ idx: number, file: string }>
    if (includes.length) {
      const tagName = 'include'
      for (let i = includes.length - 1; i >= 0; i--) {
        const include = includes[i]
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, {}, include.file)
        const rs = elemProxy?.result
        if (rs?.length) {
          newRuns.splice(include.idx, 1, ...rs)
        }
      }
    }
    const onlyRuns = newRuns.filter(r => {
      return (r.only === true) || (r.template)
    })
    if (onlyRuns.length) {
      newRuns = onlyRuns
    } else {
      newRuns = newRuns.filter(r => !r.skip)
    }
    let i = 0
    for (; i < newRuns.length; i++) {
      const allProps = newRuns[i]
      // Init props
      const props: any = allProps || {}
      if (props.runs) {
        const runs = props.runs
        props.group = {
          runs
        }
        props.runs = undefined
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

      // Retry to get tagName which is override by keys
      if (!tagName) tagName = this.getTagName(eProps)

      let { if: condition, force, debug, vars, async, detach, loop, name, id, preScript, postScript, context } = eProps
      let elemProps: any
      if (tagName) {
        // This is a tag
        elemProps = eProps[tagName]
      } else if (vars) {
        // This is "vars" tag
        tagName = 'vars'
        elemProps = vars
        vars = undefined
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
        force,
        debug,
        vars,
        detach,
        async,
        loop,
        preScript,
        postScript,
        context
      }
      // Execute
      if (loop === undefined) {
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, elemProps)
        if (elemProxy) {
          result.push(elemProxy)
          if (elemProxy.element instanceof Continue) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this.proxy)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; i++) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopKey: i,
                loopValue: loopCondition[i]
              })
              if (elemProxy) {
                result.push(elemProxy)
                if (elemProxy.element instanceof Continue) break
              }
            }
          } else if (typeof loopCondition === 'object') {
            for (const key in loopCondition) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopKey: key,
                loopValue: loopCondition[key]
              })
              if (elemProxy) {
                result.push(elemProxy)
                if (elemProxy.element instanceof Continue) break
              }
            }
          } else if (loopCondition === true) {
            while (loopCondition) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopValue: loopCondition
              })
              if (elemProxy) {
                result.push(elemProxy)
                if (elemProxy.element instanceof Continue) break
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

    const isContinue = (baseProps.if === undefined) || await this.innerScene.getVars(baseProps.if, elemProxy)
    if (!isContinue) return undefined

    if (baseProps.id) {
      await elemProxy.scene.setVars(baseProps.id, elemProxy)
    }

    const detach = baseProps.detach && await this.innerScene.getVars(baseProps.detach, elemProxy)
    const async = baseProps.async && await this.innerScene.getVars(baseProps.async, elemProxy)
    if (asyncJobs.length && !async) {
      await Promise.all(asyncJobs)
      asyncJobs.splice(0, asyncJobs.length)
    }
    const p = elemProxy.exec(parentState).finally(() => elemProxy.dispose())
    if (detach) {
      this.rootScene.pushToBackgroundJob(p)
    } else if (!async) {
      await p
    } else {
      asyncJobs.push(p)
    }
    return elemProxy
  }
}
