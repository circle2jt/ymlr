import assert from 'assert'
import chalk from 'chalk'
import { writeFile } from 'fs/promises'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { AES } from 'src/libs/encrypt/aes'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { getVars, setVars } from 'src/libs/variable'
import { parse } from 'yaml'
import { ElementBuilder } from '../element-builder'
import { ElementShadow } from '../element-shadow'
import { Element } from '../element.interface'
import { Group } from '../group/group'
import { GroupItemProps, GroupProps } from '../group/group.props'
import { VarsProps } from '../vars/vars.props'
import { prefixPassword } from './constants'
import { SceneProps } from './scene.props'

const REGEX_FIRST_UPPER = /^[A-Z]/

/** |**  scene
  Load another scene into the running program
  @example
  ```yaml
    - scene:
        name: A scene from remote server
        path: https://.../another.yaml    # path can be URL or local path
        password:                         # password to decode when the file is encrypted
        vars:                             # Set value to global environment
          foo: bar
  ```
*/
export class Scene extends Group<GroupProps, GroupItemProps> {
  title?: string
  path?: string
  encryptedPath?: string
  content?: string
  password?: string
  curDir = ''
  localVars: Record<string, any> = {}
  vars?: VarsProps
  protected isRoot = false
  protected get innerScene() {
    return this
  }

  get elementBuilder() {
    return new ElementBuilder(this)
  }

  constructor({ path, encryptPath, content, password, vars, ...props }: SceneProps) {
    super(props)
    this.$$ignoreEvalProps.push('content', 'curDir', 'localVars', 'elementBuilder')
    Object.assign(this, { path, encryptPath, content, password, vars })
  }

  async asyncConstructor() {
    const remoteFileProps = await this.getRemoteFileProps()
    this.path && this.logger.trace('%s \t%s', 'Scene', chalk.underline(this.path))
    if (Array.isArray(remoteFileProps)) {
      this.lazyInit(remoteFileProps)
    } else {
      const { title: _title, debug: _debug, password: _password, vars: _vars, vars_file: _varsFile, ...groupProps } = remoteFileProps
      const { title, debug, password, vars, varsFile } = await this.getVars({ title: _title, debug: _debug, password: _password, vars: _vars, varsFile: _varsFile }, this)
      if (this.title === undefined && title) {
        this.title = title
      }
      if (this.$$baseProps) {
        if (debug) this.$$baseProps.debug = debug
        if (this.title) this.$$baseProps.name = ''
      }
      if (password && !this.password) {
        await this.generateEncryptedFile(this.content, password)
      }
      this.lazyInit(groupProps)
      await this.loadVars(vars, varsFile)
    }
  }

  async exec() {
    if (this.title) this.logger.info('%s', this.title)
    this.copyVarsToLocal()
    if (this.isRoot) this.logger.debug('')
    const results = await super.exec()
    return results || []
  }

  async dispose() {
  }

  getPath(p: string) {
    if (!p) return p
    if (isAbsolute(p)) return p
    if (p.startsWith('~~/')) return join(this.rootScene.runDir, p.substring(3))
    if (p.startsWith('~/')) return join(this.rootScene.rootDir, p.substring(2))
    return join(this.curDir || '', p)
  }

  async getVars(str: any, ctx?: Element | ElementShadow | any, others: any = {}) {
    if ((ctx as ElementShadow)?.$$loggerLevel) {
      others.parentState = ctx.parentState
    }
    return await getVars(str, ctx, {
      vars: this.localVars,
      utils: this.rootScene.globalUtils,
      ...others
    })
  }

  async setVars(varObj: any, vl: any, ctx?: any) {
    return await setVars(varObj, vl, ctx, {
      vars: this.localVars,
      utils: this.rootScene.globalUtils
    })
  }

  mergeVars(obj: any) {
    merge(this.localVars, obj)
  }

  private copyVarsToLocal() {
    this.copyVarsToGlobal(this.scene.localVars)
    Object.assign(this.localVars, this.rootScene.globalVars)
  }

  private copyVarsToGlobal(localVars = this.localVars) {
    Object.keys(localVars)
      .filter(key => REGEX_FIRST_UPPER.test(key[0]))
      .forEach(key => {
        this.rootScene.globalVars[key] = localVars[key]
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
      const overridedVars = await (this.scene || this).getVars(this.vars, this)
      this.mergeVars(overridedVars)
    }
    this.logger.trace('[vars]    \t%j', this.localVars)
  }

  private async loadEnv(...envFiles: string[]) {
    const env = new Env(this.logger)
    await env.loadEnvToBase(this.localVars, ...envFiles.filter(e => e), process.env)
  }
}
