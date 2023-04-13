import assert from 'assert'
import { writeFile } from 'fs/promises'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { getVars, setVars } from 'src/libs/variable'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { Group } from '../group/group'
import { GroupItemProps, GroupProps } from '../group/group.props'
import { prefixPassword } from './constants'
import { SceneProps, SceneScope } from './scene.props'
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
        password:                         # password to decode when the file is encrypted
        varsFiles: [.env1, .env2]         # Load env file to variable
        scope: local                      # Value in [local, share]. Default is local
                                          # - local: Don't pass parent scene variables
                                          # - share: Pass parent scene variables
                                          # Note: Global variables are always updated
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
  localVars: Record<string, any> = {}
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
    this.ignoreEvalProps.push('content', 'curDir', 'localVars', 'isRoot', 'scope', 'event')
  }

  async asyncConstructor() {
    this.setupVars()
    await this.handleFile()
    this.proxy.rootScene.event.on('update/global-vars', (name: string) => {
      this.logger.trace('Updated global vars to scene vars - ' + name)
      this.copyGlobalVarsToLocal()
    })
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, ...remoteFileProps } = remoteFileRawProps
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

  async exec() {
    if (this.name) this.logger.info('%s', this.name)
    if (this.isRoot) this.logger.debug('')
    try {
      const results = await super.exec()
      return results || []
    } finally {
      this.copyVarsToGlobal()
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
    Object.assign(this.localVars, obj)
  }

  copyGlobalVarsToLocal() {
    Object.assign(this.localVars, this.rootScene.localVars)
  }

  private setupVars() {
    if (this.scope === 'share') {
      const newVars = this.localVars
      this.localVars = this.scene.localVars
      this.mergeVars(newVars)
      if (Object.keys(newVars).length) {
        this.copyVarsToGlobal()
      }
    } else {
      this.copyVarsToGlobal(this.scene.localVars)
      this.copyGlobalVarsToLocal()
      const newVars = this.localVars
      this.localVars = {}
      this.mergeVars(newVars)
      if (Object.keys(newVars).length) {
        this.copyVarsToGlobal()
      }
    }
  }

  private copyVarsToGlobal(localVars = this.localVars) {
    const keys = Object.keys(localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
    if (keys.length > 0) {
      keys.forEach(key => {
        this.rootScene.localVars[key] = localVars[key]
      })
      this.proxy.rootScene.event.emit('update/global-vars', this.name || this.path)
    }
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
    if (this.password) {
      this.content = await this.decryptContent(this.content, this.password)
      return JSON.parse(this.content)
    }
    const yamlType = new YamlType(this)
    return load(this.content, { schema: yamlType.spaceSchema })
  }

  private async decryptContent(content: string, password?: string) {
    if (!password || !content) return content
    try {
      return this.rootScene.globalUtils.aes.decrypt(content, `${prefixPassword}${password}`)
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
    this.encryptedPath = join(this.curDir, basename(this.path).split('.')[0])
    this.logger.trace('Encrypted to\t%s', this.encryptedPath)
    const econtent = this.rootScene.globalUtils.aes.encrypt(content, `${prefixPassword}${password}`)
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
