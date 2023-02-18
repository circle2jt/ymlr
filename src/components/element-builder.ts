import chalk from 'chalk'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { GlobalEvent } from 'src/managers/events-manager'
import { createFromShadow, ElementClass, ElementShadow } from './element-shadow'
import { RootScene } from './root-scene'
import { Scene } from './scene/scene'

export class ElementBuilder {
  private _ElementClazz!: ElementClass
  private _props?: any
  private _logger!: Logger
  private _tag?: string
  private _parent!: ElementShadow

  constructor(private readonly scene: Scene) { }

  logger(logger: Logger) {
    this._logger = logger
    return this
  }

  tag(name: string) {
    this._tag = name
    return this
  }

  parent(g: ElementShadow) {
    this._parent = g
    return this
  }

  element(ElementClazz: ElementClass, props?: any) {
    this._ElementClazz = ElementClazz
    this._props = props
    return this
  }

  async build<T = Element>() {
    const elem = createFromShadow(this._ElementClazz, this._props)
    if (this._tag) elem.$$tag = this._tag
    let thatLogger: Logger | undefined
    const logger = this._logger
    Object.defineProperties(elem, {
      scene: {
        value: this.scene,
        writable: false
      },
      rootScene: {
        value: this.scene instanceof RootScene ? this.scene : this.scene.rootScene,
        writable: false
      },
      logger: {
        get() {
          return thatLogger || (thatLogger = logger.clone(this.$$tag, this.$$loggerLevel))
        }
      },
      parent: {
        value: this._parent,
        writable: false
      }
    })

    const exec = elem.exec
    elem.exec = async function () {
      GlobalEvent.emit('element/exec')

      let isAddIndent: boolean | undefined
      const { name, force } = this.$$baseProps
      try {
        await this.evalPropsBeforeExec()

        isAddIndent = this.logger.is(LoggerLevel.INFO) && this.parent?.$$baseProps.name !== undefined
        if (isAddIndent) this.logger.addIndent()

        name && this.logger.info('%s', name)
        this.result = await exec.call(this)
      } catch (err: any) {
        this.error = err
        if (!force) throw err
        this.logger.debug(chalk.yellow(`⚠️ ${err.message}`))
      } finally {
        if (isAddIndent) this.logger.removeIndent()
      }
      await this.setVarsAfterExec()
      return this.result
    }

    const dispose = elem.dispose
    elem.dispose = async function () {
      GlobalEvent.emit('element/dispose')
      await dispose?.call(this)
    }
    if (elem?.asyncConstructor) await elem.asyncConstructor(this._props)

    return elem as T
  }
}
