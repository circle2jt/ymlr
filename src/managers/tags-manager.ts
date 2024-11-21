import assert from 'assert'
import { join } from 'path'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element, type ElementClass } from 'src/components/element.interface'
import { type Scene } from 'src/components/scene/scene'

export const ClassInFileCharacter = "'"

export class TagsManager {
  modules: Record<string, any> = {}
  tags: Record<string, any> = {}
  tagDirs: string[] = []
  private prInstall?: Promise<any>
  private readonly packages = new Array<string>()
  private get logger() {
    return this.scene.proxy.logger
  }

  constructor(private readonly scene: Scene) { }

  register(name: string, pathOfModule: string) {
    this.modules[name] = this.scene.getPath(pathOfModule)
  }

  setTag(name: string, obj: any) {
    this.tags[name] = obj
  }

  async getTag(name: string) {
    const path = this.modules[name]
    let isExit: boolean | undefined
    try {
      assert(path, `Could not found tag module "${name}"`)
      isExit = true
      const Clazz = await import(path)
      return Clazz
    } catch (err: any) {
      const tag = this.tags[name]
      if (!tag) {
        err.$$exit = isExit
        throw err
      }
      return tag
    }
  }

  reset() {
    this.modules = {}
  }

  async loadElementClass(name: string, scene: Scene) {
    const logger = scene.proxy.logger
    let ElementModule: any
    const [path, className = 'default'] = name.split(ClassInFileCharacter)
    // let classNameKebab = kebabToCamelCase(className)
    // if (className === classNameKebab) classNameKebab = undefined
    let triedToInstall: true | undefined
    let tagName: string | undefined
    do {
      const errors = []
      try {
        try {
          ElementModule = await import(`../components/${path}`)
        } catch (err) {
          for (const dir of this.tagDirs) {
            try {
              ElementModule = await import(scene.getPath(join(dir, path)))
            } catch (err) {
              errors.push(err)
            }
          }
          if (!ElementModule) throw err
        }
      } catch (err1: any) {
        errors.push(err1)
        try {
          ElementModule = await this.getTag(path)
          tagName = path
        } catch (err2: any) {
          errors.push(err2)
          if (err2.$$exit) throw err2
          try {
            ElementModule = await import(path)
          } catch (err3: any) {
            errors.push(err3)
            if (triedToInstall) {
              errors.forEach(err => logger.error(err?.message)?.trace(err))
              throw new Error(`Could not found class "${className}" in "${path}"`)
            }
            triedToInstall = true
            errors.forEach(err => logger.warn(err))
            await this.install(path)
          }
        }
      }
    } while (!ElementModule)
    let ElementClazz = ElementModule[className] // || OwnerClazz[classNameKebab]
    if (ElementClazz && !ElementClazz.prototype) {
      if (typeof ElementClazz === 'function') {
        // Function type
        try {
          ElementClazz = await ElementClazz()
        } catch (err: any) {
          err.$$exit = true
          throw err
        }
      } else {
        // Instance type
        const { constructor, ...objProps } = ElementClazz
        tagName = name
        ElementClazz = class UnknownTag implements Element {
          readonly proxy!: ElementProxy<this>

          constructor(props?: any) {
            constructor?.call(this, props)
          }

          exec() { }
          dispose() { }
        }
        Object.assign(ElementClazz.prototype, objProps)
      }
    }
    assert(ElementClazz?.prototype, `Could not found the tag "${path}.${className}"`)
    // Class type
    if (tagName) ElementClazz.tag = tagName
    return ElementClazz as ElementClass
  }

  private async install(...packages: string[]) {
    packages.forEach(pack => !this.packages.includes(pack) && this.packages.push(pack))
    if (!this.prInstall) {
      // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
      this.prInstall = new Promise<any>(async (resolve, reject) => {
        try {
          const { PackagesManagerFactory } = await import('./packages-manager-factory')
          const packagesManager = PackagesManagerFactory.GetInstance(this.logger)
          while (this.packages.length) {
            const packs = this.packages.splice(0, this.packages.length)
            this.logger.debug('Preparing to install the lack packages...')
            await packagesManager.install(...packs)
          }
          resolve(undefined)
        } catch (err) {
          reject(err)
        }
      })
    }
    await this.prInstall
    this.prInstall = undefined
  }
}
