import assert from 'assert'
import { join } from 'path'
import { ElementProxy } from 'src/components/element-proxy'
import { Element } from 'src/components/element.interface'
import { Scene } from 'src/components/scene/scene'
import { sleep } from 'src/libs/time'
import { PackagesManager } from './packages-manager'

export const ClassInFileCharacter = "'"

export class TagsManager {
  modules: Record<string, any> = {}
  tags: Record<string, any> = {}
  tagDirs: string[] = []
  private lockInstall: boolean = false
  private readonly packages = new Set<string>()
  private get logger() {
    return this.scene.proxy.logger
  }

  constructor(private readonly scene: Scene) {

  }

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

  async install(...packages: string[]) {
    while (this.lockInstall) {
      await sleep(1000)
    }
    this.lockInstall = true
    try {
      packages.forEach(pack => this.packages.add(pack))
      this.logger.debug('Preparing to install the lack packages...')
      const packagesManager = new PackagesManager(this.logger)
      await packagesManager.install(...Array.from(this.packages))
      this.packages.clear()
    } finally {
      this.lockInstall = false
    }
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
      try {
        try {
          ElementModule = await import(`../components/${path}`)
        } catch (err) {
          for (const dir of this.tagDirs) {
            try {
              ElementModule = await import(scene.getPath(join(dir, path)))
            } catch { }
          }
          if (!ElementModule) throw err
        }
      } catch (err1: any) {
        try {
          ElementModule = await this.getTag(path)
          tagName = path
        } catch (err2: any) {
          if (err2.$$exit) throw err2
          try {
            ElementModule = await import(path)
          } catch (err3: any) {
            if (triedToInstall) {
              logger.error(1, err1?.message)
              logger.error(2, err2?.message)
              logger.error(3, err3?.message)
              throw new Error(`Could not found class "${className}" in "${path}"`)
            }
            triedToInstall = true
            logger.warn(1, err1?.message)
            logger.warn(2, err2?.message)
            logger.warn(3, err3?.message)
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
    return ElementClazz
  }
}
