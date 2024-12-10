import assert from 'assert'
import { type AppEvent } from 'src/app-event'
import ENVGlobal from 'src/env-global'
import { GetLoggerLevel } from 'src/libs/logger/logger-level'
import { cloneDeep } from 'src/libs/variable'
import { noop } from 'src/managers/constants'
import { BaseElementProxy, ElementProxy } from '../element-proxy'
import { type Element, type ElementBaseProps, type ElementClass } from '../element.interface'
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
  readonly isRootScene?: boolean
  readonly isScene?: boolean
  readonly ignoreEvalProps = ['isRootScene', 'isScene']
  readonly proxy!: ElementProxy<this>

  hideName?: boolean

  protected get scene() {
    return this.proxy.scene
  }

  protected get rootScene() {
    return this.proxy.rootScene
  }

  protected get logger() {
    return this.proxy.logger
  }

  protected get innerScene() {
    return this.scene
  }

  #runs?: GroupItemProps[]

  constructor(props?: GP | GIP[]) {
    this.lazyInitRuns(props)
  }

  lazyInitRuns(props?: GP | GIP[]) {
    if (Array.isArray(props)) {
      this.#runs = props
    } else if (props) {
      this.resolveShortcutAsync(props)
      const { runs, ..._props } = props
      this.#runs = runs
      Object.assign(this, _props)
    }
  }

  async newElementProxy<T extends Element>(nameOrClass: string | ElementClass, props: any, baseProps: any = {}) {
    const elem = await this.newElement(nameOrClass, props)
    const elemProxy = new ElementProxy(elem, baseProps) as ElementProxy<T>
    let tagName = (typeof nameOrClass === 'string' ? nameOrClass : ((nameOrClass as any).tag || nameOrClass.name))
    if (elem instanceof InnerGroup) {
      tagName = `${elem.owner.proxy.tag}/inner-group`
    }
    Object.defineProperties(elemProxy, {
      tag: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: tagName
      },
      scene: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this.innerScene
      },
      rootScene: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this.innerScene.isRootScene ? this.innerScene : this.rootScene
      },
      parent: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this instanceof InnerGroup ? this.owner : (elem instanceof InnerGroup ? elem.owner : this)
      },
      _creator: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this
      }
    })
    const elemImplementedAppEvent = elemProxy.$ as any as AppEvent
    if (typeof elemImplementedAppEvent.onAppExit === 'function') this.rootScene.onAppExit.push(elemImplementedAppEvent)

    if (Object.getOwnPropertyDescriptor(elem, 'innerRunsProxy')) {
      const { name, ...groupProxyProps } = baseProps
      const innerGroupWrapper = new InnerGroupWrapper({ creator: this, owner: elem, groupProps: props, groupProxyProps })
      const innerGroupWrapperProxy = new BaseElementProxy(innerGroupWrapper, { runs: groupProxyProps.runs })
      innerGroupWrapperProxy.exec = async function (parentState: any) {
        return await this.element.exec(parentState)
      }
      innerGroupWrapperProxy.dispose = async function () {
        await this.element.dispose()
      }
      Object.defineProperty(elem, 'innerRunsProxy', {
        value: innerGroupWrapperProxy,
        enumerable: false,
        configurable: false,
        writable: false
      })
    }

    if (ENVGlobal.MODE) {
      elemProxy.evalPropsBeforeExec = noop
      elemProxy.setVarsAfterExec = noop
      elemProxy.dispose = noop
      if (!(elem instanceof Group) && !elem.innerRunsProxy) {
        elemProxy.element.exec = noop
      }
    }

    return elemProxy
  }

  async preExec(_parentState?: Record<string, any>) {
    this.resolveShortcutAsync(this.proxy)
    if (!this.proxy.runs?.length) {
      this.proxy.runs = this.#runs || []
      if (this.proxy.runs.length && !this.isScene && this.constructor?.name !== 'Group') {
        this.logger.warn(`${this.proxy.name || this.proxy.tag} should set "runs" in parent proxy element`)
      }
    }
    this.#runs = undefined
    if (!this.proxy.runs.length) {
      return true
    }

    // Preload includes tag
    await this.preHandleFilesInclude(this.proxy.runs)
    if (!this.preHandleOnlyRuns(this.proxy.runs)) {
      this.preHandleSkipRuns(this.proxy.runs)
    }

    return true
  }

  async exec(_?: Record<string, any>) {
    if (!this.proxy.runs) {
      return
    }
    const asyncJobs = new Array<Promise<any>>()
    const result = ENVGlobal.DEBUG_GROUP_RESULT ? new Array<ElementProxy<Element>>() : undefined
    let isPassedCondition = false

    const parentProxy = this instanceof InnerGroup ? this.owner?.proxy : this.proxy

    // Loop to execute each of tags
    for (const run of this.proxy.runs) {
      if (parentProxy._forceStop) {
        break
      }

      const props = cloneDeep(run)
      // when the previous step was passed valid condition
      if (isPassedCondition) {
        if (props.elseif || props.else === null) continue
        isPassedCondition = false
      }

      const { isTemplate, tagName, elemProps, baseProps = {} } = this.preHandlerProps(props)

      if (isTemplate) continue

      if (!tagName) throw new Error('Could not found tag name')

      const { loop } = baseProps

      // Execute
      if (loop === undefined) {
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, baseProps, elemProps)
        if (elemProxy) {
          isPassedCondition = !!baseProps.if || !!baseProps.elseif
          result?.push(elemProxy)
          if (elemProxy.isSkipNext) break
        }
        continue
      }
      let loopCondition = await this.innerScene.getVars(loop, this.proxy)
      if (loopCondition) {
        if (Array.isArray(loopCondition)) {
          for (let i = 0; i < loopCondition.length; ++i) {
            const newProps = cloneDeep(elemProps)
            const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
              ...baseProps,
              _loopObject: {
                loopKey: i,
                loopValue: loopCondition[i]
              }
            }, newProps)
            if (elemProxy) {
              result?.push(elemProxy)
            }
          }
        } else if (typeof loopCondition === 'object') {
          const keys = Object.keys(loopCondition)
          for (let i = 0; i < keys.length; ++i) {
            const key = keys[i]
            const newProps = cloneDeep(elemProps)
            const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
              ...baseProps,
              _loopObject: {
                loopKey: key,
                loopValue: loopCondition[key]
              }
            }, newProps)
            if (elemProxy) {
              result?.push(elemProxy)
            }
          }
        } else if (loopCondition === true) {
          do {
            const newProps = cloneDeep(elemProps)
            const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
              ...baseProps,
              _loopObject: {
                loopValue: loopCondition
              }
            }, newProps)
            if (elemProxy) {
              result?.push(elemProxy)
            }
          } while ((loopCondition = await this.innerScene.getVars(loop, this.proxy)))
        }
      }
    }
    if (asyncJobs.length) {
      await Promise.all(asyncJobs)
    }
    return result
  }

  async dispose() { }

  private resolveShortcutAsync(props?: any) {
    if (props?.['~runs']) {
      props.runs = props['~runs']
      props['~runs'] = undefined
      props.async = true
    }
  }

  private preHandlerProps(props: GroupItemProps): { isTemplate?: boolean, tagName?: string, elemProps?: any, baseProps?: ElementBaseProps } {
    // Init props
    let { '<-': inheritKeys, skip, only, ...eProps } = props
    let tagName = this.rootScene.getTagName(eProps)
    const isTemplate = !!eProps.template

    // Only support template or tag name. Prefer tag name
    if (tagName && eProps.template) {
      eProps.template = undefined
    }

    if (inheritKeys) {
      eProps = this.rootScene.inherit(tagName, eProps, inheritKeys)
    }
    const { '->': exposeKey, ..._eProps } = eProps
    eProps = _eProps
    if (exposeKey) {
      this.rootScene.export(tagName, eProps, exposeKey)
    }

    // Skip this if it's a template
    if (isTemplate) {
      return { isTemplate: true }
    }

    let { if: condition, runs, errorStack, elseif: elseIfCondition, else: elseCondition, failure, debug, vars, async, detach, skipNext, loop, name, icon, id, context } = eProps

    if (elseCondition === null) {
      elseIfCondition = true
    }

    // Retry to get tagName which is override by keys
    if (!tagName) {
      tagName = this.rootScene.getTagName(eProps)
    }

    let elemProps: any
    if (tagName) {
      // This is a tag
      elemProps = (eProps as any)[tagName]
    } else if (runs) {
      // This is a empty tag
      tagName = 'group'
      elemProps = undefined
    } else {
      // This is a empty tag
      tagName = 'base'
      elemProps = undefined
    }
    if (debug === true) {
      debug = GetLoggerLevel('debug')
    } else if (debug === false) {
      debug = GetLoggerLevel('silent')
    } else if (debug) {
      debug = GetLoggerLevel(debug)
    }
    const baseProps: ElementBaseProps = {
      id,
      name,
      icon,
      if: condition,
      elseif: elseIfCondition,
      failure,
      debug,
      vars,
      runs,
      detach,
      async,
      loop,
      context,
      skipNext,
      errorStack: {
        ...this.proxy.errorStack,
        ...errorStack,
        name,
        tag: tagName
      }
    }

    if (ENVGlobal.MODE) {
      baseProps.loop = undefined
      baseProps.async = undefined
      baseProps.detach = undefined
      baseProps.skipNext = undefined
      baseProps.if = baseProps.elseif = undefined
    }

    return { elemProps, baseProps, tagName }
  }

  public async createAndExecuteElement(asyncJobs: Array<Promise<any>>, name: string, baseProps: ElementBaseProps & { _loopObject?: { loopKey?: string | number, loopValue?: any } }, props: any) {
    const elemProxy = await this.newElementProxy(name, props, baseProps)
    // elemProxy.parentState = parentState

    const condition = baseProps.elseif ?? baseProps.if
    const isContinue = (condition === undefined) || await this.innerScene.getVars(condition, elemProxy)
    if (!isContinue) return undefined

    const [detach, async] = await Promise.all([
      elemProxy.detach ?? this.innerScene.getVars(elemProxy.detach, elemProxy),
      elemProxy.async ?? this.innerScene.getVars(elemProxy.async, elemProxy)
    ])
    if (!async && !detach && asyncJobs.length) {
      await Promise.all(asyncJobs)
      asyncJobs = []
    }

    if (elemProxy.id) {
      await elemProxy.scene.setVars(elemProxy.id, elemProxy)
    }

    const t = elemProxy
      .exec()
      .finally(elemProxy.dispose.bind(elemProxy) as () => void)

    if (detach) {
      this.rootScene.pushToBackgroundJob(t)
    } else if (async) {
      asyncJobs.push(t)
    } else {
      await t
    }
    return elemProxy
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

  private async preHandleFilesInclude(runs: GroupItemProps[]) {
    const includes = runs
      .map((e: any, i: number) => e.include ? { idx: i, include: e.include } : undefined)
      .filter(e => e)
    if (includes.length) {
      const allRuns: Array<{ idx: number, runs: any[] }> = await Promise.all(includes
        .map(async (e: any) => {
          const elemProxy = await this.createAndExecuteElement([], 'include', {}, e.include)
          return { idx: e.idx, runs: elemProxy?.result || [] }
        })
      )
      allRuns
        .reverse()
        .forEach((allRunItem) => {
          runs.splice(allRunItem.idx, 1, ...allRunItem.runs)
        })
    }
  }

  private preHandleOnlyRuns(runs: GroupItemProps[]) {
    const hasRunOnly = runs.some(r => r.only === true)
    if (hasRunOnly) {
      this.proxy.runs = runs.filter(r => (r.only === true) || (r.template))
      return true
    }
    return false
  }

  private preHandleSkipRuns(runs: GroupItemProps[]) {
    this.proxy.runs = runs.filter(r => !r.skip)
  }
}

export class InnerGroupWrapper implements Element {
  readonly proxy!: ElementProxy<this>

  #owner!: Element
  #creator!: Group<any, any>
  #groupProps: any
  #groupProxyProps: any

  get owner() {
    return this.#owner
  }

  get creator() {
    return this.#creator
  }

  get groupProps() {
    return this.#groupProps
  }

  get groupProxyProps() {
    return this.#groupProxyProps
  }

  constructor(props: { creator: Group<any, any>, owner: Element, groupProps: any, groupProxyProps: any }) {
    this.#owner = props.owner
    this.#creator = props.creator
    this.#groupProps = props.groupProps
    this.#groupProxyProps = props.groupProxyProps
  }

  async exec(parentState: Record<string, any> = {}) {
    const innerGroupProxy = await this.#creator.newElementProxy(InnerGroup, { owner: this.#owner, ...this.#groupProps }, this.#groupProxyProps)
    try {
      if (parentState) {
        if (this.#owner.proxy.parentState) {
          Object.defineProperties(parentState, {
            $parentState: {
              enumerable: true,
              configurable: true,
              writable: true,
              value: this.#owner.proxy.parentState
            },
            $ps: {
              enumerable: true,
              configurable: true,
              writable: true,
              value: this.#owner.proxy.parentState
            }
          })
        }
        innerGroupProxy.parentState = parentState
      }
      const rs = await innerGroupProxy.exec()
      return rs
    } finally {
      await innerGroupProxy.dispose()
    }
  }

  async dispose() { }
}

export class InnerGroup<GP extends GroupProps, GIP extends GroupItemProps> extends Group<GP, GIP> {
  #owner!: Element

  get owner() {
    return this.#owner
  }

  constructor(baseProps?: GP & { owner: Element }) {
    assert(baseProps?.owner)
    const { owner, ...props } = baseProps
    super(props as unknown as GP)
    this.#owner = owner
  }
}
