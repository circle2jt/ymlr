import assert from 'assert'
import { join } from 'path'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element, type ElementClass } from 'src/components/element.interface'
import { type RootScene } from 'src/components/root-scene'

export const ClassInFileCharacter = "'"

export class TagsManager {
  modules: Record<string, any> = {}
  tags: Record<string, any> = {}
  tagDirs: string[] = []
  private prInstall?: Promise<any>
  private readonly packages = new Array<string>()
  private get logger() {
    return this.rootScene.proxy.logger
  }

  private readonly caches = new Map<string, any>()

  constructor(private readonly rootScene: RootScene) { }

  register(name: string, pathOfModule: string) {
    this.modules[name] = this.rootScene.proxy.getPath(pathOfModule)
  }

  setTag(name: string, obj: any) {
    this.tags[name] = obj
  }

  async getTag(name: string) {
    const path = this.modules[name]
    try {
      assert(path, `Could not found tag "${name}" in the modules`)
      const Clazz = await import(path)
      return Clazz
    } catch (err: any) {
      const tag = this.tags[name]
      if (!tag) {
        throw err
      }
      return tag
    }
  }

  reset() {
    this.modules = {}
  }

  async loadElementClass(name: string, proxy: ElementProxy<Element>) {
    const logger = proxy.logger
    const [path, className = 'default'] = name.split(ClassInFileCharacter)
    // let classNameKebab = kebabToCamelCase(className)
    // if (className === classNameKebab) classNameKebab = undefined
    const classKey = `${path}${ClassInFileCharacter}${className}`
    let ElementClazz: any = this.caches.get(classKey)
    if (ElementClazz) return ElementClazz

    let tagName: string | undefined
    let ElementModule = this.caches.get(path)
    if (!ElementModule) {
      let triedToInstall: true | undefined
      do {
        const errors = []
        // Load from native
        try {
          ElementModule = await import(`../components/${path}`)
        } catch (err) {
          errors.push(new Error(`Could not found module at ../components/${path}`))
        }
        if (ElementModule) break

        // Load from ext tags
        try {
          ElementModule = await import(`../node_modules/${path}`)
        } catch {
          errors.push(new Error(`Could not found module at ../node_modules/${path}`))
        }
        if (ElementModule) break

        // Load from external source code
        for (const dir of this.tagDirs) {
          const modulePath = proxy.getPath(join(dir, path))
          try {
            ElementModule = await import(modulePath)
          } catch {
            errors.push(new Error(`Could not found module at "${modulePath}"`))
          }
          if (ElementModule) break
        }
        if (ElementModule) break

        // Load from tag-register
        try {
          ElementModule = await this.getTag(path)
          tagName = path
        } catch (err) {
          errors.push(err)
        }
        if (ElementModule) break

        // Load from global modules
        try {
          ElementModule = await import(path)
        } catch {
          errors.push(new Error(`Could not found global module "${path}"`))
        }
        if (ElementModule) break

        if (!triedToInstall) {
          triedToInstall = true
          errors.forEach((err: any) => logger.warn(err?.message))
          await this.install(path)
          continue
        }

        throw new Error(`Could not found class "${className}" in "${path}"`)
      } while (!ElementModule)
      this.caches.set(path, ElementModule)
    }
    ElementClazz = ElementModule[className] // || OwnerClazz[classNameKebab]
    if (ElementClazz && !ElementClazz.prototype) {
      if (typeof ElementClazz === 'function') {
        // Function type
        ElementClazz = await ElementClazz()
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
    this.caches.set(classKey, ElementClazz)
    if (tagName) ElementClazz.tag = tagName
    return ElementClazz as ElementClass
  }

  private async install(...packages: string[]) {
    if (!this.prInstall) {
      packages.forEach(pack => !this.packages.includes(pack) && this.packages.push(pack))
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
