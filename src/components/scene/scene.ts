import assert from 'assert'
import chalk from 'chalk'
import { writeFile } from 'fs/promises'
import merge from 'lodash.merge'
import { basename, dirname, isAbsolute, join, resolve } from 'path'
import { AES } from 'src/libs/encrypt/aes'
import { MD5 } from 'src/libs/encrypt/md5'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { FileTemp } from 'src/libs/file-temp'
import { getVars, setVars } from 'src/libs/variable'
import { parse } from 'yaml'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { Group } from '../group/group'
import { GroupItemProps, GroupProps } from '../group/group.props'
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
        process: false                    # Run as a child process
        vars:                             # Set value to global environment
          foo: bar
  ```
*/
export class Scene extends Group<GroupProps, GroupItemProps> {
  title?: string
  path?: string
  encryptedPath?: string
  password?: string
  vars?: Record<string, any>
  content?: string
  curDir = ''
  localVars: Record<string, any> = {}
  isRoot = false
  process?: boolean
  tmpSceneFile?: FileTemp

  protected get innerScene() {
    return this
  }

  constructor({ path, content, password, vars, process, ...props }: SceneProps) {
    super(props)
    Object.assign(this, { path, content, password, vars, process })
    this.ignoreEvalProps.push('content', 'curDir', 'localVars', 'isRoot', 'tmpSceneFile')
  }

  async asyncConstructor() {
    const remoteFileProps = await this.getRemoteFileProps()
    !this.tmpSceneFile && this.logger.trace('%s \t%s', 'Scene', chalk.underline(this.path))
    const isProcess = await this.getVars(this.process, this.proxy)
    if (isProcess && this.path) {
      this.copyVarsToGlobal(this.scene.localVars)
      void this.rootScene.workerManager.createWorker({
        path: this.path,
        password: this.password,
        globalVars: this.rootScene.globalVars,
        vars: this.vars
      }, {
        name: this.proxy.name || new MD5().encrypt(Date.now().toString() + '-' + Math.random().toString())
      }).exec()
      return
    }
    if (Array.isArray(remoteFileProps)) {
      this.lazyInitRuns(remoteFileProps)
    } else {
      const { title: _title, debug: _debug, password: _password, vars: _vars, vars_file: _varsFile, ...groupProps } = remoteFileProps
      const { title, debug, password, vars, varsFile } = await this.getVars({ title: _title, debug: _debug, password: _password, vars: _vars, varsFile: _varsFile }, this.proxy)
      if (this.title === undefined && title) {
        this.title = title
      }
      if (debug) this.proxy.debug = debug
      if (this.title) this.proxy.name = ''
      if (password && !this.password) {
        await this.generateEncryptedFile(this.content, password)
      }
      this.lazyInitRuns(groupProps)
      await this.loadVars(vars, varsFile)
    }
  }

  async exec() {
    if (this.process) {
      return []
    }
    if (this.title) this.logger.info('%s', this.title)
    this.copyVarsToLocal()
    if (this.isRoot) this.logger.debug('')
    const results = await super.exec()
    return results || []
  }

  async dispose() {
    await super.dispose()
    this.tmpSceneFile?.remove()
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
    return await setVars(varObj, vl, ctx, {
      $vars: this.localVars,
      $utils: this.rootScene.globalUtils
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
    if (!this.path && this.process) {
      this.tmpSceneFile = new FileTemp()
      this.tmpSceneFile.create(this.content || '')
      this.path = this.tmpSceneFile.file
    }
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
