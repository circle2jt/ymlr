import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { SAND_SCENE_PASSWORD } from 'src/env'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { getVars, setVars } from 'src/libs/variable'
import { Constants } from 'src/managers/constants'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'
import { type SceneProps } from './scene.props'
import { YamlType } from './yaml-type'

const REGEX_FIRST_UPPER = /^[A-Z]/

/** |**  scene
  Load another scene into the running program
  @example
  ```yaml
    - name: A scene from remote server
      # scene: ./another.yaml             # path can be URL or local path
      scene:
        name: Scene name
        path: https://.../another.yaml    # path can be URL or local path
        cached: false                     # caches yaml content to ram to prevent reload content from a file
        password:                         # password to decode when the file is encrypted
        vars:                             # They will only overrides vars in the parents to this scene
                                          # - Global variables is always passed into this scene
          foo: scene bar                  # First is lowercase is vars which is used in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
          localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
  ```
*/
export class Scene extends Group<GroupProps, GroupItemProps> {
  name?: string
  path?: string
  vars?: Record<string, any>
  cached?: boolean
  curDir = ''

  protected readonly password?: string
  protected override get innerScene() {
    return this
  }

  #content?: string
  #localVars!: { proxy: Record<string, any>, revoke: () => void }
  set localVars(vars: Record<string, any>) {
    this.#localVars = Proxy.revocable(vars, {
      set: (target: any, name: any, vl: any) => {
        if (REGEX_FIRST_UPPER.test(name[0])) {
          Object.defineProperty(target, name, {
            enumerable: true,
            get: () => {
              return this.proxy.rootScene.localVars[name]
            },
            set: (vl: any) => {
              this.proxy.rootScene.localVars[name] = vl
            }
          })
        }
        target[name] = vl
        return true
      },
      deleteProperty: (target: any, name: any) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete target[name]
        if (REGEX_FIRST_UPPER.test(name[0])) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete this.proxy.rootScene.localVars[name]
        }
        return true
      }
    })
  }

  get localVars() {
    if (!this.#localVars) {
      this.localVars = {}
    }
    return this.#localVars.proxy
  }

  get globalVars() {
    return Object.keys(this.localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
      .reduce<Record<string, any>>((sum, key) => {
      sum[key] = this.localVars[key]
      return sum
    }, {})
  }

  #localCaches!: Map<string, any[]>
  get localCaches() {
    if (!this.#localCaches) {
      this.#localCaches = new Map<string, any[]>()
    }
    return this.#localCaches
  }

  get encryptedPath() {
    const name = basename(this.path as string)
    return join(this.curDir, name.substring(0, name.lastIndexOf('.')))
  }

  constructor(eProps: SceneProps | string) {
    if (typeof eProps === 'string') {
      eProps = { path: eProps }
    }
    const { path, content, password, vars, ...props } = eProps
    super(props)
    this.password = password
    this.#content = content
    Object.assign(this, { path, vars })
    this.ignoreEvalProps.push('curDir', 'password')
  }

  async asyncConstructor() {
    this.localVars = this.rootScene.globalVars
    await this.handleFile()
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, env, ...remoteFileProps } = remoteFileRawProps
      if (env && this.isRootScene) {
        this.logger.debug('Loading env')
        if (Array.isArray(env)) {
          (env as string[]).forEach(e => {
            const idx = e.indexOf('=')
            process.env[e.substring(0, idx)] = e.substring(idx + 1)
          })
        } else if (typeof env === 'object') {
          Object.keys(env).forEach((e: string) => {
            process.env[e] = env[e]
          })
        }
      }
      LoggerFactory.LoadFromEnv()
      if (password) {
        await this.generateEncryptedFile(remoteFileProps, password)
      }
      const { name: _name, debug: _debug, vars: _vars, vars_file: _varsFiles, ...groupProps } = remoteFileProps
      const { name, debug, vars, varsFiles = [] } = await this.getVars({ name: _name, debug: _debug, vars: _vars, varsFiles: _varsFiles }, this.proxy)
      if (debug) this.proxy.setDebug(debug)
      if (this.name === undefined && name) this.name = name
      this.lazyInitRuns(groupProps)
      await this.loadVars(vars, Array.isArray(varsFiles) ? varsFiles : [varsFiles])
    }
    if (!this.proxy.errorStack) {
      this.proxy.errorStack = {}
    }
    this.proxy.errorStack.sceneFile = this.path
    if (!this.proxy.errorStack.sourceFile) {
      this.proxy.errorStack.sourceFile = this.path
    }
  }

  override async exec(parentState?: Record<string, any>) {
    if (this.name) this.logger.info(this.name)
    const results = await super.exec(parentState)
    return results || []
  }

  override async dispose() {
    this.#localVars?.revoke()
    await super.dispose()
  }

  getPath(p: string) {
    if (!p) return p
    if (isAbsolute(p)) return p
    if (p.startsWith('~~/')) return join(this.rootScene.runDir, p.substring(3))
    if (p.startsWith('~/')) return join(this.rootScene.rootDir, p.substring(2))
    return join(this.curDir || '', p)
  }

  async getVars(str: any, ctx?: ElementProxy<Element> | any, others: any = {}) {
    this.proxy.injectOtherCxt(ctx, others)
    return await getVars(str, ctx, {
      $vars: this.localVars,
      $utils: this.rootScene.globalUtils,
      $const: Constants,
      ...others
    })
  }

  async setVars(varObj: any, vl: any, ctx?: any) {
    const others = {}
    this.proxy.injectOtherCxt(ctx, others)
    return await setVars(varObj, vl, ctx, {
      $vars: this.localVars,
      $utils: this.rootScene.globalUtils,
      $const: Constants,
      ...others
    })
  }

  private mergeVars(obj: any) {
    Object.assign(this.localVars, obj)
  }

  private async getRemoteFileProps() {
    let props: any
    this.path = await this.scene.getVars(this.path)
    let fileRemote: FileRemote | undefined
    let content = this.#content
    if (!content && this.path) {
      fileRemote = new FileRemote(this.path, this.scene || this)
      if (!fileRemote.isRemote) {
        this.path = resolve(fileRemote.uri)
        const dirPath = dirname(this.path)
        if (this.isRootScene) this.rootScene.rootDir = dirPath
        this.curDir = dirPath
      }
      if (this.cached) {
        props = this.scene.localCaches.get(fileRemote.uri)
        if (props) {
          return props
        }
      }
      content = await fileRemote.getTextContent()
    }
    assert(content, 'Scene file is not valid format')
    if (this.password) {
      content = await this.decryptContent(content, this.password)
      props = JSON.parse(content)
    } else {
      const yamlType = new YamlType(this)
      content = await this.prehandleFile(content)
      props = load(content, { schema: yamlType.spaceSchema })
    }
    if (this.cached && fileRemote) {
      this.scene.localCaches.set(fileRemote.uri, props)
    }
    return props
  }

  /** |**  # @include
    Include the content file to current position.
    This is will be read a file then copy file content into current position
    If you want to use expresion ${}, you can use tag "include".
    Useful for import var file ....
    @position top
    @tag It's a yaml comment type
    @example
    ```yaml
      - vars:
          # @include ./.env
    ```

    `.env` file is
    ```text
    ENV: production
    APP: test
    ```
  */
  private async prehandleFile(content: string) {
    const cnt = await Promise.all(content
      .split('\n')
      .map(async (cnt: string) => {
        const m = cnt.match(/^([\s\t]*)#\s*@include\s*(.+)/)
        if (m) {
          const f = new FileRemote(m[2].trim(), this.scene || this)
          const cnt = await f.getTextContent()
          return cnt
            .split('\n')
            .map((c: string) => `${m[1]}${c}`)
        }
        return cnt
      })
    )
    return cnt.flat().join('\n')
  }

  private async decryptContent(content: string, password?: string) {
    if (!password || !content) return content
    try {
      return this.rootScene.globalUtils.aes.decrypt(content, `${SAND_SCENE_PASSWORD}${password}`)
    } catch (err: any) {
      if (err?.code === 'ERR_OSSL_BAD_DECRYPT') {
        throw new Error(`Password to decrypt the file "${this.path}" is not valid`)
      }
      throw err
    }
  }

  private async generateEncryptedFile(contentObject?: any, password?: string) {
    if (!password || !this.path || !contentObject) return
    const content = JSON.stringify(contentObject)
    this.logger.trace('Encrypted to\t%s', this.encryptedPath)
    const econtent = this.rootScene.globalUtils.aes.encrypt(content, `${SAND_SCENE_PASSWORD}${password}`)
    const { writeFile } = await import('fs/promises')
    await writeFile(this.encryptedPath, econtent)
  }

  private async loadVars(vars: Record<string, any> = {}, varsFiles?: string[]) {
    if (varsFiles?.length) {
      for (const varsFile of varsFiles) {
        const file = new FileRemote(varsFile, this)
        const content = await file.getTextContent()
        let newVars: any = {}
        try {
          newVars = JSON.parse(content)
        } catch {
          newVars = load(content)
        }
        merge(vars, newVars)
      }
    }
    this.mergeVars(vars)
    if (this.isRootScene) await this.loadEnv()
    if (this.vars) {
      const overridedVars = await (this.scene || this).getVars(this.vars, this.proxy)
      this.mergeVars(overridedVars)
    }
    this.logger.trace('[vars]    \t%j', this.localVars)
  }

  private async loadEnv(...envFiles: string[]) {
    const env = new Env(this.logger)
    await env.loadEnvToBase(this.localVars, ...envFiles.filter(e => e), process.env)
  }
}
