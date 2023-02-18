import { callFunctionScript } from 'src/libs/async-function'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { isGetEvalExp } from 'src/libs/variable'
import { Element } from './element.interface'
import { ElementBaseProps } from './element.props'
import { RootScene } from './root-scene'
import { Scene } from './scene/scene'

const IGNORE_EVAL_ELEMENT_SHADOW_BASE_PROPS = [
  'loop', 'if', 'vars', 'async'
]

const IGNORE_EVAL_ELEMENT_SHADOW_PROPS = [
  '$$baseProps',
  '$$evalExps',
  '$$ignoreVarsBeforeExec',
  'error',
  'loopKey',
  'loopValue',
  '$$tag',
  'parent',
  'parentState',
  'result',
  'logger',
  'scene',
  'rootScene'
]

export type ElementShadowClass = new (props?: any) => ElementShadow
export type ElementClass = new (props?: any) => Element

export abstract class ElementShadow implements Element {
  // [parent: string]: any
  $$baseProps: ElementBaseProps = {}
  $$ignoreEvalProps: string[] = []
  $$tag!: string
  loopKey?: any
  loopValue?: any
  parentState?: Record<string, any> = {}
  parent?: ElementShadow

  result?: any
  error?: Error

  logger!: Logger
  scene!: Scene
  rootScene!: RootScene

  asyncConstructor(_props?: any) { }

  get $$loggerLevel(): LoggerLevel {
    return this.$$baseProps?.debug || this.parent?.$$loggerLevel || this.rootScene?.logger.levelName || LoggerLevel.ALL
  }

  getParentByClassName<T extends ElementShadow>(...ClazzTypes: Array<new (...args: any[]) => ElementShadow>): T {
    let parent = this.parent
    do {
      if (ClazzTypes.some(ClazzType => parent instanceof ClazzType)) {
        return parent as T
      }
      parent = parent?.parent as T
    } while (parent)
    return parent as T
  }

  async setVarsAfterExec() {
    if (this.$$baseProps.vars) {
      const keys = await this.scene.setVars(this.$$baseProps.vars, this.result, this)
      if (!keys?.length) return
      this.logger.trace('[vars] \t%j', keys.reduce<Record<string, any>>((sum, e) => {
        sum[e] = this.scene.localVars[e]
        return sum
      }, {}))
    }
  }

  async evalPropsBeforeExec() {
    const props = Object.keys(this)
    const proms = props
      .filter(key => {
        return !IGNORE_EVAL_ELEMENT_SHADOW_PROPS.includes(key) &&
          !this.$$ignoreEvalProps?.includes(key) &&
          // @ts-expect-error
          isGetEvalExp(this[key])
      }).map(async key => {
        // @ts-expect-error
        this[key] = await this.scene.getVars(this[key], this)
      })
    const baseProps = Object.keys(this.$$baseProps)
    proms.push(...baseProps
      .filter(key => {
        return !IGNORE_EVAL_ELEMENT_SHADOW_BASE_PROPS.includes(key) &&
          // @ts-expect-error
          isGetEvalExp(this.$$baseProps[key])
      }).map(async key => {
        // @ts-expect-error
        this.$$baseProps[key] = await this.scene.getVars(this.$$baseProps[key], this)
      }))
    proms.length && await Promise.all(proms)
  }

  async callFunctionScript(script: string, ctx: ElementShadow = this, others: Record<string, any> = {}) {
    const rootScene = this.rootScene
    const rs = await callFunctionScript(script, ctx, {
      logger: this.logger,
      vars: this.scene.localVars,
      get utils() {
        return rootScene.globalUtils
      },
      ...others
    })
    return rs
  }

  abstract exec(): Promise<any>
  dispose(): any { }
}

const ownerProperties = Object.getOwnPropertyNames(ElementShadow.prototype).filter(k => !['constructor', 'exec', 'dispose'].includes(k))

export function createFromShadow(Clazz: any, props?: any): ElementShadow {
  if (Clazz.prototype.$$loggerLevel) return new Clazz(props)
  ownerProperties.forEach(k => {
    // @ts-expect-error
    if (!Clazz.prototype[k]) Clazz.prototype[k] = ElementShadow.prototype[k]
  })
  const elem = new Clazz(props)
  if (!elem.$$ignoreEvalProps) elem.$$ignoreEvalProps = []
  if (!elem.$$baseProps) elem.$$baseProps = {}
  return elem
}
