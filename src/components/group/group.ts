import cloneDeep from 'lodash.clonedeep'
import { Continue } from '../continue/continue'
import { ElementClass, ElementShadow } from '../element-shadow'
import { ElementBaseKeys, ElementBaseProps } from '../element.props'
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

  private getTagName(props: any) {
    const keys = Object.keys(props)
    return keys.find(key => !ElementBaseKeys.includes(key) && props[key] !== undefined)
  }

  async runEachOfElements(parentState?: Record<string, any>) {
    const asyncJobs = new Array<Promise<any>>()
    const runs = new Array<ElementShadow>()
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
        const elem = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, elemProps)
        if (elem) {
          runs.push(elem)
          if (elem instanceof Continue) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; i++) {
              const newProps = elemProps && cloneDeep(elemProps)
              const newElem = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
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
              const newProps = elemProps && cloneDeep(elemProps)
              const newElem = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
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
              const newProps = elemProps && cloneDeep(elemProps)
              const newElem = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, newProps, {
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

    const async = baseProps.async && await this.innerScene.getVars(baseProps.async, { parent: this, parentState, ...loopObj }, { parentState })

    if (asyncJobs.length && !async) {
      await Promise.all(asyncJobs)
      asyncJobs.splice(0, asyncJobs.length)
    }

    const elem = await this.newElement(name, props)
    // Init props
    Object.assign(elem, loopObj)
    elem.$$baseProps = baseProps
    // Execute
    const p = elem.exec(parentState).finally(() => elem.dispose())
    if (!async) {
      await p
    } else {
      asyncJobs.push(p)
    }
    return elem
  }
}
