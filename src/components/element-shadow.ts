import { callFunctionScript } from 'src/libs/async-function'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { isGetEvalExp } from 'src/libs/variable'
import { Element } from './element.interface'
import { RootScene } from './root-scene'
import { Scene } from './scene/scene'
import { VarsProps } from './vars/vars.props'

const IGNORE_EVAL_ELEMENT_SHADOW_PROPS = [
  '$$evalExps',
  '$$ignoreVarsBeforeExec',
  'skip',
  'error',
  'vars',
  'loop',
  'loopKey',
  'loopValue',
  'if',
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
  // [parent*: string]: any
  $$ignoreEvalProps: string[] = []
  title?: string
  skip?: boolean
  force?: boolean
  error?: any
  debug?: LoggerLevel
  vars?: VarsProps
  async?: boolean
  loop?: string
  loopKey?: any
  loopValue?: any
  if?: any
  // @ts-expect-error
  $$tag: string
  parentState?: Record<string, any> = {}
  parent?: ElementShadow
  result?: any
  // @ts-expect-error
  logger: Logger
  // @ts-expect-error
  scene: Scene
  // @ts-expect-error
  rootScene: RootScene

  get $$loggerLevel(): LoggerLevel {
    return this.debug || this.parent?.$$loggerLevel || this.rootScene?.logger.levelName || LoggerLevel.ALL
  }

  asyncConstructor(_props?: any) { }

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
    if (this.vars) {
      const keys = await this.scene.setVars(this.vars, this.result, this)
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
    proms.length && await Promise.all(proms)
  }

  async callFunctionScript(script: string, ctx: ElementShadow = this, others: Record<string, any> = {}) {
    const rs = await callFunctionScript(script, ctx, {
      logger: this.logger,
      vars: this.scene.localVars,
      utils: this.rootScene.globalUtils,
      ...others
    })
    return rs
  }

  abstract exec(input?: Record<string, any>): Promise<any>
  dispose(): any { }
  disposeApp?: () => any
}

const ownerProperties = Object.getOwnPropertyNames(ElementShadow.prototype).filter(k => !['constructor', 'exec', 'dispose'].includes(k))

export function copyElementShadowPrototype(elem: any) {
  if (elem.$$loggerLevel) return
  if (!elem.$$ignoreEvalProps) elem.$$ignoreEvalProps = []
  ownerProperties.forEach(k => {
    // @ts-expect-error
    if (!elem[k]) elem[k] = ElementShadow.prototype[k]
  })
}
