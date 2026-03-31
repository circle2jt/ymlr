import assert from 'assert'
import merge from 'lodash.merge'
import { type AppEvent } from 'src/app-event'
import ENVGlobal from 'src/env-global'
import { GetLoggerLevel } from 'src/libs/logger/logger-level'
import { Sequence } from 'src/libs/sequence'
import { sleep } from 'src/libs/time'
import { cloneDeep } from 'src/libs/variable'
import { Constants, noop } from 'src/managers/constants'
import { ElementProxy } from '../element-proxy'
import { type Element, type ElementBaseProps, type ElementClass } from '../element.interface'
import { Scene } from '../scene/scene'
import { GroupShadow } from './group-shadow'
import { type GroupItemProps, type GroupProps } from './group.props'
import { Restartor } from './restartor'

export const QUICK_TAG_REGEX = /^([~;]*)([a-zA-Z0-9].*)/

enum ExecReturnCode {
  CONTINUE = 1,
  BREAK = 2,
}

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
  private static readonly SequenceRestartJob = new Map<string, Sequence>()
  readonly isRootScene?: boolean
  readonly isScene?: boolean
  readonly ignoreEvalProps = ['isRootScene', 'isScene', 'runs']
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

  private runs?: GroupItemProps[]

  constructor(props?: GP | GIP[]) {
    this.lazyInitRuns(props)
  }

  lazyInitRuns(props?: GP | GIP[]) {
    if (Array.isArray(props)) {
      this.runs = props
    } else if (props) {
      props = this.normalizeProps(props) as GP
      const { runs, ..._props } = props
      this.runs = runs
      Object.assign(this, _props)
      if (runs?.length && !(this instanceof Scene)) {
        console.warn('Should use "runs" in proxy, not in the tag %j', this.proxy.tag)
      }
    }
  }

  async newElementProxy<T extends Element>(nameOrClass: string | ElementClass, props: any, baseProps: any = {}) {
    const elem = await this.newElement(nameOrClass, props)
    if (elem.overrideProxyProps) {
      merge(baseProps, elem.overrideProxyProps())
    }
    const elemProxy = new ElementProxy(elem, baseProps) as ElementProxy<T>
    let tagName = baseProps.tag || (typeof nameOrClass === 'string' ? nameOrClass : ((nameOrClass as any).tag || nameOrClass.name))
    if (elem instanceof InnerGroup) {
      tagName = `${elem.owner.proxy.tag}/inner-group`
    }
    let parent: any = this instanceof InnerGroup ? this.owner : (elem instanceof InnerGroup ? elem.owner : this)
    if (parent instanceof GroupShadow) {
      parent = parent.owner
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
        value: parent
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
      const innerGroupWrapperProxy = await this.newElementProxy(InnerGroupWrapper, {
        creator: this,
        owner: elem,
        groupProps: props,
        groupProxyProps
      }, {
        runs: groupProxyProps.runs
      })
      Object.defineProperties(innerGroupWrapperProxy, {
        tag: {
          enumerable: false,
          configurable: false,
          writable: true,
          value: `${elemProxy.tag}/inner-group-wrapper`
        }
        // parentState: {
        //   get() {
        //     return elemProxy.parentState
        //   }
        // }
      })
      innerGroupWrapperProxy.exec = function (parentState: any) {
        return this.$.exec(parentState)
      }
      innerGroupWrapperProxy.dispose = async function () {
        await this.$.dispose()
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

  async preExec() {
    this.resolveShortcutAsync(this.proxy)
    if (!this.proxy.runs?.length) {
      this.proxy.runs = this.runs || []
      if (this.proxy.runs.length && !this.isScene && this.constructor?.name !== 'Group') {
        this.logger.warn(`${this.proxy.name || this.proxy.tag} should set "runs" in parent proxy element`)
      }
    }
    this.runs = undefined
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

  async exec() {
    if (!this.proxy.runs) {
      return
    }
    const asyncJobs = new Array<Promise<any>>()
    const result = ENVGlobal.DEBUG_GROUP_RESULT ? new Array<ElementProxy<Element>>() : undefined
    const condition = {
      isPassedCondition: false
    }
    const parentProxy = this instanceof InnerGroup ? this.owner?.proxy : this.proxy

    // Loop to execute each of tags
    for (const runProps of this.proxy.runs) {
      if (parentProxy._forceStop) {
        break
      }
      const resultCode = await this.execElement(runProps, asyncJobs, result, condition)
      if (resultCode === ExecReturnCode.CONTINUE) {
        continue
      }
      if (resultCode === ExecReturnCode.BREAK) {
        break
      }
    }
    if (parentProxy._forceStop) {
      setImmediate(() => (parentProxy.$ as any)?.stop?.())
    }
    if (asyncJobs.length) {
      await Promise.all(asyncJobs)
    }
    return result
  }

  async dispose() {
    this.runs = undefined
  }

  private resolveShortcutAsync(props?: any) {
    if (props?.['~runs']) {
      props.runs = props['~runs']
      props['~runs'] = undefined
      props.async = true
    }
  }

  private normalizeProps(runProps: any): any {
    let props = runProps
    if (typeof runProps === 'string') {
      props = { js: runProps } as any
    } else {
      Object.keys(props).forEach(key => {
        if (props[key] === undefined) return

        const m = key.match(QUICK_TAG_REGEX)
        if (!m) return

        if (m[1] && m[2]) {
          if (!props.async && m[1].includes('~')) {
            props.async = true
          }
          if (!props.template && m[1].includes(';')) {
            props.template = true
          }
          props[m[2]] = props[key]
          props[key] = undefined
        }
      })
    }
    if (props.case !== undefined) {
      props.if = props.case
      props.skipNext = true
      props.case = undefined
    }
    return props
  }

  private async execElement(runProps: GroupItemProps, asyncJobs: Array<Promise<any>> | undefined, result: Array<ElementProxy<Element>> | undefined, opts: { shareElemPropsRef?: any, isPassedCondition?: boolean, parentState?: any }) {
    const _props = this.normalizeProps(runProps)
    const props = cloneDeep(_props)
    // when the previous step was passed valid condition
    if (opts.isPassedCondition) {
      if (props.elseif || props.else === null) {
        return ExecReturnCode.CONTINUE
      }
      opts.isPassedCondition = false
    }

    let { isTemplate, tagName, elemProps, baseProps = {} } = this.preHandlerProps(props)

    if (isTemplate) {
      return ExecReturnCode.CONTINUE
    }

    if (!tagName) {
      throw new Error('Could not found tag name')
    }

    const { loop } = baseProps
    if (opts.shareElemPropsRef) {
      elemProps = Object.assign({}, elemProps, opts.shareElemPropsRef)
    }

    // Execute
    if (loop === undefined) {
      const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, baseProps, elemProps, undefined, opts.parentState)
      if (elemProxy) {
        opts.isPassedCondition = !!baseProps.if || !!baseProps.elseif
        result?.push(elemProxy)
        if (elemProxy.isSkipNext) {
          return ExecReturnCode.BREAK
        }
      }
      return ExecReturnCode.CONTINUE
    }
    let loopCondition = await this.innerScene.getVars(loop, this.proxy)
    if (loopCondition) {
      if (Array.isArray(loopCondition)) {
        for (let i = 0; i < loopCondition.length; ++i) {
          const newProps = cloneDeep(elemProps)
          const newBaseProps = cloneDeep(baseProps)
          const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
            ...newBaseProps,
            _loopObject: {
              loopKey: i,
              loopValue: loopCondition[i]
            }
          }, newProps, undefined, opts.parentState)
          if (elemProxy) {
            result?.push(elemProxy)
          }
        }
      } else if (typeof loopCondition === 'object') {
        const keys = Object.keys(loopCondition)
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i]
          const newProps = cloneDeep(elemProps)
          const newBaseProps = cloneDeep(baseProps)
          const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
            ...newBaseProps,
            _loopObject: {
              loopKey: key,
              loopValue: loopCondition[key]
            }
          }, newProps, undefined, opts.parentState)
          if (elemProxy) {
            result?.push(elemProxy)
          }
        }
      } else if (loopCondition === true) {
        do {
          const newProps = cloneDeep(elemProps)
          const newBaseProps = cloneDeep(baseProps)
          const elemProxy = await this.createAndExecuteElement(asyncJobs, tagName, {
            ...newBaseProps,
            _loopObject: {
              loopValue: loopCondition
            }
          }, newProps, undefined, opts.parentState)
          if (elemProxy) {
            result?.push(elemProxy)
          }
        } while ((loopCondition = await this.innerScene.getVars(loop, this.proxy)))
      }
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

      if (!tagName) {
        tagName = this.rootScene.getTagName(eProps)
      }
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

    let { if: condition, runs, errorStack, _curDir, elseif: elseIfCondition, else: elseCondition, failure, debug, vars, async, detach, skipNext, loop, name, icon, id, context, placeholder, catch: catchHandler, finally: finallyHandler } = eProps

    if (elseCondition === null) {
      elseIfCondition = true
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
      catch: catchHandler,
      finally: finallyHandler,
      failure,
      debug,
      vars,
      runs,
      detach,
      async,
      loop,
      context,
      placeholder,
      skipNext,
      _curDir,
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

  public async createAndExecuteElement(asyncJobs: Array<Promise<any>> | undefined, name: string, baseProps: ElementBaseProps & { _loopObject?: { loopKey?: string | number, loopValue?: any } }, props: any, restartor?: Restartor, parentState?: any) {
    const elemProxy = await this.newElementProxy(name, props, baseProps)
    const [isAsync, isDetach] = await Promise.all([
      elemProxy.isAsync(),
      elemProxy.isDetach()
    ])
    if (asyncJobs?.length && !isAsync && !isDetach) {
      await Promise.all(asyncJobs)
      asyncJobs.splice(0, asyncJobs.length)
    }

    const isContinue = await elemProxy.isValid()
    if (!isContinue) return undefined

    const t = (async () => {
      let delayRetry: { t?: Promise<any> | undefined, msg?: string } = {}
      try {
        await elemProxy.exec(parentState)
      } catch (err: any) {
        let error = err
        let failureLogger = elemProxy.logger
        const elementProxyFailure = elemProxy.failure
        const elementProxyErrorStack = elemProxy.logger.errorStack

        if (baseProps.catch?.length) {
          elemProxy.parentState.error = error
          let innerGroupWrapperProxy: ElementProxy<Element> | undefined
          try {
            const groupProxyProps = {
              runs: baseProps.catch,
              failure: {
                debug: 'silent'
              }
            }
            innerGroupWrapperProxy = await this.newElementProxy(InnerGroupWrapper, {
              creator: this,
              owner: elemProxy.$,
              groupProps: {},
              groupProxyProps
            }, groupProxyProps)
            await innerGroupWrapperProxy.exec(elemProxy.parentState)
          } catch (catchError) {
            error = catchError
          } finally {
            await innerGroupWrapperProxy?.dispose()
          }
        } else if (baseProps.finally?.length) {
          elemProxy.parentState.error = error
        }

        if (baseProps.failure) {
          const { filterDebug, ...failureProps } = baseProps.failure

          if (baseProps.failure.restart && elementProxyFailure?.restart) {
            baseProps.failure.restart.count = elementProxyFailure.restart.count || 0
          }

          const failure = await this.scene.getVars(cloneDeep(failureProps), this)
          if (failure.debug) {
            const failureDebug = (!failure.debug || failure.debug === true) ? 'warn' : failure.debug
            failureLogger = failureLogger.clone(failureLogger.context, GetLoggerLevel(failureDebug), elementProxyErrorStack)
          }

          const isLogError = !filterDebug || await filterDebug(
            error,
            this.proxy.parentState,
            this.proxy.parentState,
            this.proxy.scene.localVars,
            this.proxy.scene.localVars,
            this.proxy.rootScene.globalUtils,
            this.proxy.rootScene.globalUtils,
            Constants,
            Constants,
            process.env,
            process.env)
          if (isLogError) {
            const failureDebug = (!failure.debug || failure.debug === true) ? 'warn' : failure.debug
            if (failureDebug) {
              failureLogger = elemProxy.logger.clone(elemProxy.context, GetLoggerLevel(failureDebug), elemProxy.logger.errorStack)
            }
          }

          if (isLogError) failureLogger.debug(error?.message)?.trace(error)

          const canRestart = failure.restart?.max && (failure.restart.max < 0 || (failure.restart.count + 1 <= failure.restart.max))
          if (canRestart) {
            ++failure.restart.count
            if (baseProps.failure.restart) {
              baseProps.failure.restart.count = failure.restart.count
            }

            delayRetry = {
              t: Promise.resolve(true),
              msg: `Restart after ${failure.restart.sleep || '0s'}(${failure.restart.count}/${failure.restart.max}) \t ${error.message}`
            }
            if (failure.restart.sleep) {
              this.logger.debug(`sleep ${failure.restart.sleep}`)
              delayRetry.t = delayRetry.t?.then(async () => { await sleep(failure.restart.sleep) })
            }
            let sequence: Sequence | undefined
            if (failure.restart.sequence) {
              sequence = Group.SequenceRestartJob.get(failure.restart.sequence.name)
              if (!sequence) {
                sequence = new Sequence(failure.restart.sequence.sleep)
                Group.SequenceRestartJob.set(failure.restart.sequence.name, sequence)
              }
              delayRetry.t = delayRetry.t?.then(async () => await sequence?.wait(this))
            }
            this.logger.debug('wait my turn')
            this.logger.debug('ok, it\'s my turn. Restarting...')
          } else if (failure.retryEvent) {
            const retryEvent = failure.retryEvent
            delayRetry = {
              t: new Promise((resolve) => {
                this.proxy.globalEvent.once(retryEvent, () => { resolve(true) })
              }),
              msg: `Waiting retry event "${retryEvent}"`
            }
            this.logger.debug(`Received retry event "${failure.retryEvent}"`)
          }
          if (delayRetry.t) return
        }
        if (!(baseProps?.failure as any)?.ignore) {
          throw error
        }
      } finally {
        if (!restartor?.next && baseProps.finally?.length) {
          let innerGroupWrapperProxy: ElementProxy<Element> | undefined
          try {
            const groupProxyProps = {
              runs: baseProps.finally,
              failure: {
                debug: 'silent'
              }
            }
            innerGroupWrapperProxy = await this.newElementProxy(InnerGroupWrapper, {
              creator: this,
              owner: elemProxy.$,
              groupProps: {},
              groupProxyProps
            }, groupProxyProps)
            await innerGroupWrapperProxy.exec(elemProxy.parentState)
          } finally {
            await innerGroupWrapperProxy?.dispose()
          }
        }
        await elemProxy.dispose()
      }
      if (delayRetry.t) {
        this.logger.debug(delayRetry.msg)
        await delayRetry.t

        if (baseProps.async) baseProps.async = false
        if (baseProps.detach) baseProps.detach = false
        if (!restartor) throw new Error('Why restartor is null ???')
        restartor.next = this.createAndExecuteElement(undefined, name, baseProps, props, restartor, parentState)
      }
    })()

    if (restartor) {
      await t
      return elemProxy
    }

    const supportRestart = baseProps.failure?.restart || baseProps.failure?.retryEvent
    if (supportRestart) {
      restartor = new Restartor(name)
      restartor.t = t
    }

    const execution = restartor ? restartor.exec() : t

    if (isDetach) {
      this.rootScene.pushToBackgroundJob(execution)
      return elemProxy
    }

    if (isAsync && asyncJobs) {
      asyncJobs.push(execution)
      return elemProxy
    }

    await execution
    return elemProxy
  }

  private async newElement(nameOrClass: string | ElementClass, props: any) {
    let ElemClass: ElementClass
    if (typeof nameOrClass === 'string') {
      const name = nameOrClass
      ElemClass = await this.rootScene.tagsManager.loadElementClass(name, this.proxy)
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
      const allRuns: Array<{ idx: number, runs: Array<ElementProxy<Element>> }> = await Promise.all(includes
        .map(async (e: any) => {
          const elemProxy = await this.createAndExecuteElement(undefined, 'include', {
            _curDir: this.proxy._curDir
          }, e.include)
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

  private readonly _owner!: Element
  get owner() {
    return this._owner
  }

  private readonly _creator!: Group<any, any>
  get creator() {
    return this._creator
  }

  private readonly _groupProps: any
  get groupProps() {
    return this._groupProps
  }

  private readonly _groupProxyProps: any
  get groupProxyProps() {
    return this._groupProxyProps
  }

  constructor(props: { creator: Group<any, any>, owner: Element, groupProps: any, groupProxyProps: any }) {
    this._owner = props.owner
    this._creator = props.creator
    this._groupProps = props.groupProps
    this._groupProxyProps = props.groupProxyProps
  }

  async exec(parentState = {}) {
    const innerGroupProxy = await this._creator.newElementProxy(InnerGroup, {
      owner: this._owner
    }, {
      runs: this._groupProxyProps?.runs
    })
    try {
      innerGroupProxy.parentState = { ...this.proxy.parentState, ...parentState }
      innerGroupProxy.wps = parentState
      const rs = await innerGroupProxy.exec(parentState)
      return rs
    } finally {
      await innerGroupProxy.dispose()
    }
  }

  async dispose() { }
}

export class InnerGroup<GP extends GroupProps, GIP extends GroupItemProps> extends Group<GP, GIP> {
  _owner!: Element

  get owner() {
    return this._owner
  }

  constructor(baseProps?: GP & { owner: Element }) {
    assert(baseProps?.owner, 'owner is required')
    const { owner, ...props } = baseProps
    super(props as unknown as GP)
    this._owner = owner
  }
}
