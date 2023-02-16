import cloneDeep from 'lodash.clonedeep'
import { Logger } from 'src/libs/logger'
import { Continue } from '../continue/continue'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { ElementBaseKeys, ElementBaseProps, ElementClass } from '../element.props'
import { RootScene } from '../root-scene'
import scene from '../scene'
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
  proxy!: ElementProxy<this>
  scene!: scene
  rootScene!: RootScene
  parent!: Element
  logger!: Logger
  loopKey?: any
  loopValue?: any

  protected runs: GIP[] = []
  protected get innerScene() {
    return this.scene
  }

  init(props: GP | GIP[]) {
    this.proxy.$$ignoreEvalProps.push('runs')
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

  async newElement(nameOrClass: string | ElementClass) {
    if (typeof nameOrClass === 'string') {
      const name = nameOrClass
      const ElemClass: ElementClass = await this.rootScene.tagsManager.loadElementClass(name, this.innerScene)
      return new ElemClass()
    }
    const ElemClass = nameOrClass
    return new ElemClass()
  }

  async newElementProxy(nameOrClass: string | ElementClass, props: any = {}, baseProps: any = {}, loopObj: any = {}) {
    const elem = await this.newElement(nameOrClass)
    if (elem.lazyInit) {
      baseProps.elementAsyncProps = props
    }
    const elemProxy = new ElementProxy(elem, baseProps)
    elemProxy.$$tag = nameOrClass?.toString()
    elemProxy.logger = this.logger.clone(this.proxy.$$tag, this.proxy.$$loggerLevel)
    elemProxy.parent = this.proxy
    elemProxy.scene = this.scene
    elemProxy.rootScene = this.scene instanceof RootScene ? this.scene : this.scene.rootScene
    if (loopObj) {
      elemProxy.loopKey = loopObj.loopKey
      elemProxy.loopValue = loopObj.loopValue
    }
    elemProxy.buildElement()
    await elem.init(props)
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
    const runs = new Array<ElementProxy<Element>>()
    const newRuns = cloneDeep(this.runs)
    for (const allProps of newRuns) {
      // Init props
      const props: GroupItemProps = allProps || {}
      if (props.runs) {
        const runs = props.runs
        props.group = {
          runs
        }
        props.runs = undefined
      }
      let { '<-': inheritKeys, '->': exposeKey, skip, ...eProps } = props
      let tagName = this.getTagName(eProps)

      // Only support template or tag name. Prefer tag name
      if (tagName && eProps.template) eProps.template = undefined

      if (inheritKeys) eProps = this.rootScene.extend(tagName, eProps, inheritKeys)
      if (exposeKey) this.rootScene.export(tagName, eProps, exposeKey)

      // Retry to get tagName which is override by keys
      if (!tagName) tagName = this.getTagName(eProps)

      // Skip when skip=true or it's a template
      if (skip || eProps.template) continue

      let { if: condition, force, debug, vars, async, loop, name } = eProps
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
      const baseProps: ElementBaseProps = {
        name,
        if: condition,
        force,
        debug,
        vars,
        async,
        loop
      }
      // Execute
      if (loop === undefined) {
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, elemProps)
        if (elemProxy) {
          runs.push(elemProxy)
          if (elemProxy instanceof Continue) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; i++) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopKey: i,
                loopValue: loopCondition[i]
              })
              if (elemProxy) {
                runs.push(elemProxy)
                if (elemProxy instanceof Continue) break
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
                runs.push(elemProxy)
                if (elemProxy instanceof Continue) break
              }
            }
          } else if (loopCondition === true) {
            while (loopCondition) {
              const newProps = elemProps && cloneDeep(elemProps)
              const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
                loopValue: loopCondition
              })
              if (elemProxy) {
                runs.push(elemProxy)
                if (elemProxy instanceof Continue) break
              }
              loopCondition = await this.innerScene.getVars(loop, this)
            }
          }
        }
      }
    }
    if (asyncJobs.length) {
      await Promise.all(asyncJobs)
    }
    return runs
  }

  private async createAndExecuteElement(asyncJobs: Array<Promise<any>>, name: string, parentState: any, baseProps: ElementBaseProps, props: any, loopObj: { loopKey?: any, loopValue?: any } = {}) {
    const isContinue = (baseProps.if === undefined) || await this.innerScene.getVars(baseProps.if, { parent: this, parentState, ...loopObj }, { parentState })
    if (!isContinue) return undefined

    const async = baseProps.async && await this.innerScene.getVars(baseProps.async, { parent: this, parentState, ...loopObj }, { parentState })

    if (asyncJobs.length && !async) {
      await Promise.all(asyncJobs)
      asyncJobs.splice(0, asyncJobs.length)
    }

    const elemProxy = await this.newElementProxy(name, props, baseProps, loopObj)
    // Execute
    const p = elemProxy.exec(parentState).finally(() => elemProxy.dispose())
    if (!async) {
      await p
    } else {
      asyncJobs.push(p)
    }
    return elemProxy
  }
}
