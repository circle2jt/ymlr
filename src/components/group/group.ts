import cloneDeep from 'lodash.clonedeep'
import { Continue } from '../continue/continue'
import { ElementClass, ElementShadow } from '../element-shadow'
import { ElementBaseProps } from '../element.props'
import { GroupItemProps, GroupProps } from './group.props'

/** |**  group
  Group elements
  @example
  ```yaml
    - group:
        title: Print all of message
        runs:
          - echo: hello
          - echo: world
          - group:
              title: Stop
              runs:
                - exit:
  ```
*/
export class Group<GP extends GroupProps, GIP extends GroupItemProps> extends ElementShadow {
  $$ignoreEvalProps = ['runs']

  protected runs: GIP[] = []
  protected get innerScene() {
    return this.scene
  }

  constructor(props: GP | GIP[]) {
    super()
    this.lazyInit(props)
  }

  lazyInit(props: GP | GIP[]) {
    if (Array.isArray(props)) {
      props = {
        runs: props
      } as any
    }
    Object.assign(this, props)
    this.runs = this.runs?.filter(e => e) || []
  }

  async newElement(nameOrClass: string | ElementClass, props?: any) {
    let elem: ElementShadow
    if (typeof nameOrClass === 'string') {
      const name = nameOrClass
      const ElemClass = await this.rootScene.tagsManager.loadElementClass(name, this.innerScene)
      elem = this.innerScene.elementBuilder
        .element(ElemClass, props)
        .tag(name)
        .parent(this)
        .logger(this.logger)
        .build<ElementShadow>()
    } else {
      // const name = (nameOrClass as any).$$tag || nameOrClass.name || nameOrClass.constructor?.name
      const ElemClass = nameOrClass
      elem = await this.innerScene.elementBuilder
        .element(ElemClass, props)
        // .tag(name)
        .parent(this)
        .logger(this.logger)
        .build<ElementShadow>()
    }
    return elem
  }

  async exec(parentState?: Record<string, any>) {
    return await this.runEachOfElements(parentState)
  }

  async runEachOfElements(parentState?: Record<string, any>) {
    const asyncJobs = new Array<Promise<any>>()
    const runs = new Array<ElementShadow>()
    const newRuns = cloneDeep(this.runs)
    for (const _e of newRuns) {
      // Init props
      const e: GroupItemProps = typeof _e === 'string' ? { echo: { content: _e } } : _e
      const name = Object.keys(e)[0]
      let props = e[name]
      let baseProps: ElementBaseProps = {}
      if (props && typeof props === 'object' && !Array.isArray(props)) {
        const { '<-': inheritKeys, '->': exposeKey, skip, ...eProps } = props
        if (inheritKeys) this.rootScene.extend(eProps, inheritKeys)
        if (exposeKey) this.rootScene.export(exposeKey, eProps)
        const { if: condition, force, debug, vars, async, loop, ...customProps } = eProps
        baseProps = {
          if: condition,
          force,
          debug,
          vars,
          async,
          loop
        }
        props = customProps
        if (skip) continue
      }
      // Execute
      const loop = baseProps.loop
      if (loop === undefined) {
        const elem = await this.createAndExecuteElement(asyncJobs, name, parentState, baseProps, props)
        if (elem) {
          runs.push(elem)
          if (elem instanceof Continue) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; i++) {
              const newProps = props && cloneDeep(props)
              const newElem = await this.createAndExecuteElement(asyncJobs, name, parentState, baseProps, newProps, {
                loopKey: i,
                loopValue: loopCondition[i]
              })
              if (newElem) {
                runs.push(newElem)
                if (newElem instanceof Continue) break
              }
            }
          } else if (typeof loopCondition === 'object') {
            for (const key in loopCondition) {
              const newProps = props && cloneDeep(props)
              const newElem = await this.createAndExecuteElement(asyncJobs, name, parentState, baseProps, newProps, {
                loopKey: key,
                loopValue: loopCondition[key]
              })
              if (newElem) {
                runs.push(newElem)
                if (newElem instanceof Continue) break
              }
            }
          } else if (loopCondition === true) {
            while (loopCondition) {
              const newProps = props && cloneDeep(props)
              const newElem = await this.createAndExecuteElement(asyncJobs, name, parentState, baseProps, newProps, {
                loopValue: loopCondition
              })
              if (newElem) {
                runs.push(newElem)
                if (newElem instanceof Continue) break
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

    if (asyncJobs.length && !baseProps?.async) {
      await Promise.all(asyncJobs)
      asyncJobs.splice(0, asyncJobs.length)
    }

    const elem = await this.newElement(name, props)
    // Init props
    Object.assign(elem, loopObj, baseProps)
    // Execute
    const p = elem.exec(parentState).finally(() => elem.dispose())
    if (!elem.async) {
      await p
    } else {
      asyncJobs.push(p)
    }
    return elem
  }
}
