import { type AppEvent } from 'src/app-event'
import { DEBUG_GROUP_RESULT, MODE } from 'src/env'
import { GetLoggerLevel, LoggerLevel } from 'src/libs/logger/logger-level'
import { cloneDeep } from 'src/libs/variable'
import { ElementProxy } from '../element-proxy'
import { type Element, type ElementBaseProps, type ElementClass } from '../element.interface'
import Include from '../include'
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
  readonly ignoreEvalProps: string[] = ['isRootScene']
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

  async newElementProxy<T extends Element>(nameOrClass: string | ElementClass, props: any, baseProps: any = {}, loopObj: any = {}) {
    const elem = await this.newElement(nameOrClass, props)
    const elemProxy = new ElementProxy(elem, baseProps) as ElementProxy<T>
    elemProxy.tag = typeof nameOrClass === 'string' ? nameOrClass : ((nameOrClass as any).tag || nameOrClass.name)
    Object.defineProperty(elemProxy, 'scene', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: this.innerScene
    })
    if (this.proxy.tag === 'inner-runs-proxy') {
      Object.defineProperty(elemProxy, 'parent', {
        enumerable: false,
        // configurable: false,
        writable: false,
        value: this.proxy.parent
      })
    } else {
      Object.defineProperty(elemProxy, 'parent', {
        enumerable: false,
        // configurable: false,
        writable: false,
        value: this
      })
    }
    if (this.innerScene.isRootScene) {
      Object.defineProperty(elemProxy, 'rootScene', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this.innerScene
      })
    } else {
      Object.defineProperty(elemProxy, 'rootScene', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this.rootScene
      })
    }
    Object.assign(elemProxy, loopObj)
    const elemImplementedAppEvent = elemProxy.$ as any as AppEvent
    if (typeof elemImplementedAppEvent.onAppExit === 'function') this.rootScene.onAppExit.push(elemImplementedAppEvent)

    if (Object.getOwnPropertyDescriptor(elem, 'innerRunsProxy')) {
      const { name, ...innerRunProxyProps } = baseProps
      const innerRunsProxy = await this.newElementProxy(Group, props, innerRunProxyProps)
      innerRunsProxy.tag = 'inner-runs-proxy'
      const innerRuns = innerRunsProxy.$
      Object.defineProperties(innerRunsProxy, {
        parent: {
          enumerable: false,
          // configurable: false,
          writable: false,
          value: elem
        }
      })
      const disposeInnerRunsProxy = innerRunsProxy.dispose.bind(innerRunsProxy)
      innerRunsProxy.dispose = async () => {
        await disposeInnerRunsProxy()
        await elemProxy.dispose()
      }
      // @ts-expect-error auto be injected by system
      elem.innerRunsProxy = innerRunsProxy
      // @ts-expect-error auto init by system
      if (!elem.ignoreEvalProps) elem.ignoreEvalProps = []
      if (innerRuns.ignoreEvalProps?.length) {
        elem.ignoreEvalProps.push('innerRunsProxy', ...innerRuns.ignoreEvalProps)
      }
    }

    if (MODE) {
      if (!(elem instanceof Include)) {
        elemProxy.loop = undefined
        elemProxy.async = undefined
        elemProxy.detach = undefined
        elemProxy.skipNext = undefined
        elemProxy.if = elemProxy.elseif = undefined
        elemProxy.evalPropsBeforeExec = async () => { }
        elemProxy.setVarsAfterExec = async () => { }
        elemProxy.dispose = async () => { }
        const elem = elemProxy.element as any
        if (elem.runEachOfElements) {
          // elemProxy.element.exec = async (parentState = {}) => {
          //   await elem.runEachOfElements(parentState)
          //   return true
          // }
        } else if (elem.innerRunsProxy) {
          elemProxy.element.exec = async () => {
            return elem.innerRunsProxy.exec()
          }
        } else {
          elemProxy.element.exec = async () => { }
        }
      }
    }
    return elemProxy
  }

  async preExec(parentState?: Record<string, any>) {
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
    const includes = this.proxy.runs
      .map((e: any, i: number) => e.include ? { idx: i, include: e.include } : undefined)
      .filter(e => e)
    if (includes.length) {
      const runs = await Promise.all(includes
        .map(async (e: any) => {
          const elemProxy = await this.createAndExecuteElement([], 'include', parentState, {}, e.include)
          return { idx: e.idx, runs: elemProxy?.result || [] }
        })
      ) as Array<{ idx: number, runs: any[] }>
      for (let i = runs.length - 1; i >= 0; i--) {
        this.proxy.runs.splice(runs[i].idx, 1, ...runs[i].runs)
      }
    }

    // Check tags which are picked to run then ignore others
    const hasRunOnly = this.proxy.runs.some(r => r.only === true)
    if (hasRunOnly) {
      this.proxy.runs = this.proxy.runs.filter(r => (r.only === true) || (r.template))
    } else {
      // Ignore skip tags
      this.proxy.runs = this.proxy.runs.filter(r => !r.skip)
    }

    return true
  }

  async exec(parentState?: Record<string, any>) {
    return await this.runEachOfElements(parentState)
  }

  async runEachOfElements(parentState?: Record<string, any>) {
    if (!this.proxy.runs) {
      return
    }
    const asyncJobs = new Array<Promise<any>>()
    const result = DEBUG_GROUP_RESULT ? new Array<ElementProxy<Element>>() : undefined
    let isPassedCondition = false

    // Loop to execute each of tags
    for (const run of this.proxy.runs) {
      const allProps = cloneDeep(run)

      if (isPassedCondition) {
        if (allProps.elseif || allProps.else === null) continue
        isPassedCondition = false
      }

      // Init props
      const props: any = allProps || {}
      let { '<-': inheritKeys, skip, only, ...eProps } = props
      let tagName = this.rootScene.getTagName(eProps)
      const isTemplate = !!eProps.template

      // Only support template or tag name. Prefer tag name
      if (tagName && eProps.template) eProps.template = undefined

      if (inheritKeys) eProps = this.rootScene.extend(tagName, eProps, inheritKeys)
      const { '->': exposeKey, ..._eProps } = eProps
      eProps = _eProps
      if (exposeKey) this.rootScene.export(tagName, eProps, exposeKey)

      // Skip this if it's a template
      if (isTemplate) continue

      let { if: condition, runs, errorStack, elseif: elseIfCondition, else: elseCondition, failure, debug, vars, async, detach, skipNext, loop, name, id, context } = eProps

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
        elemProps = eProps[tagName]
      } else if (runs) {
        // This is a empty tag
        tagName = 'group'
        elemProps = {}
      } else {
        // This is a empty tag
        tagName = 'base'
        elemProps = {}
      }
      if (debug === true) {
        debug = LoggerLevel.debug
      } else if (debug) {
        debug = GetLoggerLevel(debug)
      }
      const baseProps: ElementBaseProps = {
        id,
        name,
        errorStack: {
          ...this.proxy.errorStack,
          ...errorStack,
          name,
          tag: tagName
        },
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
        skipNext
      }
      // Execute
      if (loop === undefined || MODE) {
        const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, parentState, baseProps, elemProps)
        if (elemProxy) {
          isPassedCondition = !!baseProps.if || !!baseProps.elseif
          result?.push(elemProxy)
          if (elemProxy.isSkipNext) break
        }
      } else {
        let loopCondition = await this.innerScene.getVars(loop, this.proxy)
        if (loopCondition) {
          if (Array.isArray(loopCondition)) {
            for (let i = 0; i < loopCondition.length; ++i) {
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
            for (let i = 0; i < keys.length; ++i) {
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

  async dispose() { }

  private resolveShortcutAsync(props?: any) {
    if (props?.['~runs']) {
      props.runs = props['~runs']
      props.async = true
      props['~runs'] = undefined
    }
  }

  private async createAndExecuteElement(asyncJobs: Array<Promise<any>>, name: string, parentState: any, baseProps: ElementBaseProps, props: any, loopObj: { loopKey?: any, loopValue?: any } = {}) {
    const elemProxy = await this.newElementProxy(name, props, baseProps, loopObj)
    elemProxy.parentState = parentState

    const async = elemProxy.async && await this.innerScene.getVars(elemProxy.async, elemProxy)
    if (!async && asyncJobs.length) {
      await Promise.all(asyncJobs)
      asyncJobs = []
    }

    const condition = elemProxy.elseif ?? elemProxy.if
    const isContinue = (condition === undefined) || await this.innerScene.getVars(condition, elemProxy)
    if (!isContinue) return undefined

    const proms: Array<Promise<any>> = []

    if (elemProxy.id) {
      proms.push(elemProxy.scene.setVars(elemProxy.id, elemProxy))
    }
    if (elemProxy.detach) {
      proms.push((async () => {
        elemProxy.detach = await this.innerScene.getVars(elemProxy.detach, elemProxy)
      })())
    }
    if (proms.length) {
      await Promise.all(proms)
    }

    if (elemProxy.detach) {
      this.rootScene.pushToBackgroundJob(elemProxy, parentState)
    } else if (async) {
      asyncJobs.push((async (elemProxy: ElementProxy<any>) => {
        try {
          const rs = await elemProxy.exec(parentState)
          return rs
        } finally {
          await elemProxy.dispose()
        }
      })(elemProxy))
    } else {
      try {
        await elemProxy.exec(parentState)
      } finally {
        await elemProxy.dispose()
      }
    }
    // }
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
}
