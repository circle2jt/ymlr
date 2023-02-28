import assert from 'assert'
import { writeFile } from 'fs/promises'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { AES } from 'src/libs/encrypt/aes'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { getVars, setVars } from 'src/libs/variable'
import { parse, stringify } from 'yaml'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { Group } from '../group/group'
import { GroupItemProps, GroupProps } from '../group/group.props'
import { prefixPassword } from './constants'
import { SceneProps, SceneScope } from './scene.props'

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
        password:                         # password to decode when the file is encrypted
        scope: local                      # Value in [local, share]. Default is local
                                          # - Global vars is always share, but scene vars is
                                          #   - local: Variables in the scene only apply in the scene
                                          #   - share: Variabes in the scene will be updated to all of scene
        vars:                             # They will only overrides "vars" in the scene
          foo: scene bar                  # First is lowercase is vars in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
  ```
*/
export class Scene extends Group<GroupProps, GroupItemProps> {
  name?: string
  path?: string
  scope?: SceneScope
  encryptedPath?: string
  password?: string
  vars?: Record<string, any>
  content?: string
  curDir = ''
  localVars!: Record<string, any>
  isRoot = false

  protected get innerScene() {
    return this
  }

  constructor(eProps: SceneProps | string) {
    if (typeof eProps === 'string') {
      eProps = { path: eProps }
    }
    const { path, content, password, vars, scope, ...props } = eProps
    super(props)
    Object.assign(this, { path, content, password, vars, scope })
    this.ignoreEvalProps.push('content', 'curDir', 'localVars', 'isRoot', 'scope')
  }

  async asyncConstructor() {
    this.setupVars()
    await this.handleFile()
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, ...remoteFileProps } = remoteFileRawProps
      if (password) {
        await this.generateEncryptedFile(stringify(remoteFileProps), password)
      }
      const { name: _name, debug: _debug, vars: _vars, vars_file: _varsFile, ...groupProps } = remoteFileProps
      const { name, debug, vars, varsFile } = await this.getVars({ name: _name, debug: _debug, vars: _vars, varsFile: _varsFile }, this.proxy)
      if (debug) this.proxy.setDebug(debug)
      if (this.name === undefined && name) this.name = name
      this.lazyInitRuns(groupProps)
      await this.loadVars(vars, varsFile)
    }
  }

  async exec() {
    if (this.name) this.logger.info('%s', this.name)
    if (this.isRoot) this.logger.debug('')
    try {
      const results = await super.exec()
      return results || []
    } finally {
      this.copyVarsToGlobal()
      this.scene.copyGlobalVarsToLocal()
    }
  }

  async dispose() {
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

  mergeVars(obj: any) {
    merge(this.localVars, obj)
  }

  copyGlobalVarsToLocal() {
    Object.assign(this.localVars, this.rootScene.localVars)
  }

  private setupVars() {
    if (this.scope === 'share') {
      this.localVars = this.scene.localVars
    } else {
      this.localVars = {}
      this.copyVarsToGlobal(this.scene.localVars)
      this.copyGlobalVarsToLocal()
    }
  }

  private copyVarsToGlobal(localVars = this.localVars) {
    Object.keys(localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
      .forEach(key => {
        this.rootScene.localVars[key] = localVars[key]
      })
  }

  private async getRemoteFileProps() {
    if (this.path) {
      const fileRemote = new FileRemote(this.path, this.scene || this)
      this.content = await fileRemote.getTextContent()
      if (!fileRemote.isRemote) {
        this.path = resolve(fileRemote.uri)
        const dirPath = dirname(this.path)
        if (this.isRoot) this.rootScene.rootDir = dirPath
        this.curDir = dirPath
      }
    }
    assert(this.content, 'Scene file is not valid format')
    const remoteFileProps = parse(await this.decryptContent(this.content, this.password))
    return remoteFileProps
  }

  private async decryptContent(content: string, password?: string) {
    if (!password) return content
    try {
      const encryptor = new AES(`${prefixPassword}${password}`)
      return encryptor.decrypt(content)
    } catch (err: any) {
      if (err?.code === 'ERR_OSSL_BAD_DECRYPT') {
        throw new Error(`Password to decrypt the file "${this.path}" is not valid`)
      }
      throw err
    }
  }

  private async generateEncryptedFile(content?: string, password?: string) {
    if (!password || !this.path || !content) return
    this.encryptedPath = join(this.curDir, basename(this.path).split('.')[0])
    this.logger.trace('Encrypted to\t%s', this.encryptedPath)
    const encryptor = new AES(`${prefixPassword}${password}`)
    const econtent = encryptor.encrypt(content)
    await writeFile(this.encryptedPath, econtent)
  }

  private async loadVars(vars: Record<string, any> = {}, varsFile?: string) {
    if (varsFile) {
      const file = new FileRemote(varsFile, this)
      const content = await file.getTextContent()
      let newVars = {}
      try {
        newVars = JSON.parse(content)
      } catch {
        newVars = parse(content)
      }
      merge(vars, newVars)
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
