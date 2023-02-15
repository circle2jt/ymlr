import assert from 'assert'
import chalk from 'chalk'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { GlobalEvent } from 'src/managers/events-manager'
import { createFromShadow, ElementClass, ElementShadow } from './element-shadow'
import { Element } from './element.interface'
import { RootScene } from './root-scene'
import { Scene } from './scene/scene'

export class ElementBuilder {
  private elem?: ElementShadow

  constructor(private readonly scene: Scene) { }

  logger(logger: Logger) {
    assert(this.elem)
    let thatLogger: Logger | undefined
    Object.defineProperty(this.elem, 'logger', {
      get() {
        return thatLogger || (thatLogger = logger.clone(this.tag, this.$$loggerLevel))
      }
    })
    return this
  }

  tag(name: string) {
    assert(this.elem)
    this.elem.$$tag = name
    return this
  }

  parent(g?: ElementShadow) {
    assert(this.elem)
    Object.defineProperty(this.elem, 'parent', {
      value: g,
      writable: false
    })
    return this
  }

  element(ElementClazz: ElementClass, props?: any) {
    this.elem = createFromShadow(ElementClazz, props)
    Object.defineProperties(this.elem, {
      scene: {
        value: this.scene,
        writable: false
      },
      rootScene: {
        value: this.scene instanceof RootScene ? this.scene : this.scene.rootScene,
        writable: false
      }
    })
    const exec = this.elem.exec
    this.elem.exec = async function (parentState?: Record<string, any>) {
      Object.defineProperty(this, 'parentState', {
        value: parentState,
        writable: false
      })
      if (this.asyncConstructor) await this.asyncConstructor(props)

      GlobalEvent.emit('element/exec')

      let isAddIndent: boolean | undefined
      try {
        await this.evalPropsBeforeExec()

        isAddIndent = this.logger.is(LoggerLevel.INFO) && this.parent?.$$baseProps.name !== undefined
        if (isAddIndent) this.logger.addIndent()

        this.$$baseProps.name && this.logger.info('%s', this.$$baseProps.name)
        this.result = await exec.call(this, this.parentState)
      } catch (err: any) {
        this.error = err
        if (!this.$$baseProps.force) throw err
        this.logger.debug(chalk.yellow(`⚠️ ${err.message}`))
      } finally {
        if (isAddIndent) this.logger.removeIndent()
      }
      await this.setVarsAfterExec()
      return this.result
    }

    const dispose = this.elem.dispose
    this.elem.dispose = async function () {
      GlobalEvent.emit('element/dispose')
      await dispose?.call(this)
    }

    if (this.elem.disposeApp !== undefined) {
      this.elem.rootScene.disposeApps.push(this.elem)
    }
    return this
  }

  build<T = Element>() {
    if (!this.elem) throw new Error('')
    return this.elem as T
  }
}
