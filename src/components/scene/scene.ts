import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { SAND_SCENE_PASSWORD } from 'src/env'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { getVars, setVars } from 'src/libs/variable'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'
import { RootScene } from '../root-scene'
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

  localVars: Record<string, any> = {}

  readonly localCaches = new Map<string, any[]>()
  protected readonly password?: string

  #updateGlobalVarsListener?: any
  #content?: string

  get encryptedPath() {
    const name = basename(this.path as string)
    return join(this.curDir, name.substring(0, name.lastIndexOf('.')))
  }

  protected get innerScene() {
    return this
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
    this.ignoreEvalProps.push('curDir', 'localVars', 'localCaches')
  }

  async asyncConstructor() {
    this.#updateGlobalVarsListener = (name: string) => {
      this.logger.trace('Updated global vars to scene vars - ' + name)
      this.copyGlobalVarsToLocal()
    }
    this.rootScene.event.on('update/global-vars', this.#updateGlobalVarsListener)
    this.copyVarsToGlobal(this.scene.localVars)
    await this.handleFile()
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, env, ...remoteFileProps } = remoteFileRawProps
      if (env && this instanceof RootScene) {
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
  }

  override async exec(parentState?: Record<string, any>) {
    if (this.name) this.logger.info(this.name)
    try {
      const results = await super.exec(parentState)
      return results || []
    } finally {
      this.copyVarsToGlobal()
    }
  }

  override async dispose() {
    if (this.#updateGlobalVarsListener) this.rootScene.event.off('update/global-vars', this.#updateGlobalVarsListener)
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
      ...others
    })
  }

  async setVars(varObj: any, vl: any, ctx?: any) {
    const others = {}
    this.proxy.injectOtherCxt(ctx, others)
    return await setVars(varObj, vl, ctx, {
      $vars: this.localVars,
      $utils: this.rootScene.globalUtils,
      ...others
    })
  }

  private mergeVars(obj: any) {
    Object.assign(this.localVars, obj)
  }

  private copyGlobalVarsToLocal() {
    Object.keys(this.rootScene.localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
      .forEach(key => {
        this.localVars[key] = this.rootScene.localVars[key]
      })
  }

  private copyVarsToGlobal(localVars = this.localVars) {
    Object.keys(localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
      .forEach(key => {
        this.rootScene.localVars[key] = localVars[key]
      })
    this.rootScene.event.emit('update/global-vars', this.name || this.path)
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
        if (this.isRoot) this.rootScene.rootDir = dirPath
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
    if (this.isRoot) await this.loadEnv()
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
