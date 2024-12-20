import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { basename, dirname, join } from 'path'
import ENVGlobal from 'src/env-global'
import { Env } from 'src/libs/env'
import { FileRemote } from 'src/libs/file-remote'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { cloneDeep, getVars, setVars } from 'src/libs/variable'
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
        env:                              # Set to env variable. Support an array or object (- key=value) (key: value)
          NODE_ENV: production
          # Or
          - NODE_ENV=production
        vars:                             # They will only overrides vars in the parents to this scene
                                          # - Global variables is always passed into this scene
          foo: scene bar                  # First is lowercase is vars which is used in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
          localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
        envFiles:                         # Load env variable from files (string | string[])
          - .env
          - .env.dev
        varsFiles:                        # Load vars from json or yaml files (string | string[])
          - ./var1.json
          - ./var2.yaml
  ```
*/
export class Scene extends Group<GroupProps, GroupItemProps> {
  override readonly isScene = true
  name?: string
  path?: string
  vars?: Record<string, any>
  cached?: boolean

  templatesManager: Record<string, any> = {}

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
      .reduce((sum: Record<string, any>, key) => {
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
    return join(this.proxy.curDir, name.substring(0, name.lastIndexOf('.')))
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
    this.ignoreEvalProps.push('curDir', 'password', 'templatesManager')
  }

  async asyncConstructor() {
    this.localVars = this.rootScene.globalVars
    Object.assign(this.templatesManager, this.scene.templatesManager)
    await this.handleFile()
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, env, envFiles, ...remoteFileProps } = remoteFileRawProps

      if (envFiles?.length) {
        let envArrFiles = []
        if (Array.isArray(envFiles)) {
          envArrFiles = envFiles
        } else if (typeof envFiles === 'string') {
          envArrFiles.push(envFiles)
        }
        for (const envFile of envArrFiles) {
          const fm = new FileRemote(envFile, this.proxy)
          const content = await fm.getTextContent()
          Object.assign(process.env, Env.ParseEnvContent(content, true))
        }
      }

      if (env) {
        this.logger.debug('Loading env')
        if (Array.isArray(env)) {
          (env as string[]).forEach(line => {
            const [key, value] = Env.ParseEnvLine(line, true)
            process.env[key] = value
          })
        } else if (typeof env === 'object') {
          Object.entries(env).forEach(([key, value]) => {
            process.env[key] = value as string
          })
        }
      }

      LoggerFactory.LoadFromEnv()
      if (password) {
        await this.generateEncryptedFile(remoteFileProps, password)
      }
      const { name: _name, debug: _debug, vars: _vars, varsFiles: _varsFiles, ...groupProps } = remoteFileProps
      const { name, debug, vars, varsFiles = [] } = await this.getVars({ name: _name, debug: _debug, vars: _vars, varsFiles: _varsFiles }, this.proxy)
      if (!this.proxy.debug && debug) this.proxy.setDebug(debug)
      if (this.name === undefined && name) this.name = name
      this.lazyInitRuns(groupProps)

      let varArrFiles = []
      if (varsFiles?.length) {
        if (Array.isArray(varsFiles)) {
          varArrFiles = varsFiles
        } else if (typeof varsFiles === 'string') {
          varArrFiles.push(varsFiles)
        }
      }

      await this.loadVars(vars, varArrFiles, [])
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
    this.templatesManager = {}
    await super.dispose()
  }

  async getVars(str: any, ctx?: ElementProxy<Element> | any, others: any = {}) {
    return await getVars(str, ctx, {
      ...others,
      ...ctx?.contextExpose,

      $vars: this.localVars,
      $utils: this.rootScene.globalUtils,
      $const: Constants,
      $env: process.env,

      $v: this.localVars,
      $u: this.rootScene.globalUtils,
      $c: Constants,
      $e: process.env
    })
  }

  async setVars(varObj: any, vl: any, ctx?: any) {
    return await setVars(varObj, vl, ctx, {
      ...ctx?.contextExpose,

      $vars: this.localVars,
      $utils: this.rootScene.globalUtils,
      $const: Constants,
      $env: process.env,

      $v: this.localVars,
      $u: this.rootScene.globalUtils,
      $c: Constants,
      $e: process.env
    })
  }

  private mergeVars(obj: any) {
    Object.assign(this.localVars, obj)
  }

  protected async getRemoteFileProps() {
    let props: any
    this.path = await this.scene.getVars(this.path)
    let fileRemote: FileRemote | undefined
    let content = this.#content
    if (!content && this.path) {
      fileRemote = new FileRemote(this.path, this.proxy.parentProxy || null)
      if (!fileRemote.isRemote) {
        this.path = fileRemote.uri
        const dirPath = dirname(this.path)
        if (this.isRootScene) this.rootScene.rootDir = dirPath
        this.proxy.curDir = dirPath
      }
      if (this.cached) {
        props = this.rootScene.localCaches.get(fileRemote.uri)
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
      this.rootScene.localCaches.set(fileRemote.uri, props)
    }
    return props
  }

  inherit(tagName: string | undefined, baseProps: any, ids: string[] | string) {
    if (!ids?.length) return
    if (typeof ids === 'string') ids = [ids]
    const caches = ids.reverse().map(id => {
      const cached = this.templatesManager[id]
      if (!cached) {
        throw new Error(`Could not found element with id "${id}"`)
      }
      const { tagName: _tagName, ...props } = cached
      if (!tagName) {
        tagName = _tagName
      }
      return cloneDeep(props)
    })
    caches.forEach(cached => {
      if (tagName && cached.template !== undefined) {
        cached[tagName] = cached.template
        cached.template = undefined
      }
      baseProps = merge(cached, baseProps)
    })
    // this.logger.trace('extends id "%s": %j', ids, baseProps)
    return baseProps
  }

  export(tagName: string | undefined, allProps: any, id: string) {
    if (!id) return
    // No clone erroStask, condition...
    const { errorStack, if: condition, elseif: elseIfCondition, else: elseCondition, ...props } = allProps
    const newOne = cloneDeep(props)
    if (tagName) {
      newOne.tagName = tagName
      if (newOne[tagName] !== undefined) {
        newOne.template = newOne[tagName]
        newOne[tagName] = undefined
      }
    }
    this.templatesManager[id] = newOne
    // this.logger.trace('export to id "%s": %j', id, this.templatesManager[id])
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
          const f = new FileRemote(m[2].trim(), this.proxy.parentProxy || null)
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
      return this.rootScene.globalUtils.aes.decrypt(content, `${ENVGlobal.SAND_SCENE_PASSWORD}${password}`)
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
    const econtent = this.rootScene.globalUtils.aes.encrypt(content, `${ENVGlobal.SAND_SCENE_PASSWORD}${password}`)
    const { writeFile } = await import('fs/promises')
    await writeFile(this.encryptedPath, econtent)
  }

  private async loadVars(vars: Record<string, any> = {}, varsFiles: string[], envFiles: string[]) {
    for (const varsFile of varsFiles) {
      const file = new FileRemote(varsFile, this.proxy)
      const content = await file.getTextContent()
      let newVars: any = {}
      try {
        newVars = JSON.parse(content)
      } catch {
        newVars = load(content)
      }
      merge(vars, newVars)
    }
    this.mergeVars(vars)
    await this.loadEnv(...envFiles)

    if (this.vars) {
      const overridedVars = await (this.scene || this).getVars(this.vars, this.proxy)
      this.mergeVars(overridedVars)
    }
    this.logger.trace('[vars]    \t%j', this.localVars)
  }

  private async loadEnv(...envFiles: string[]) {
    await Env.LoadEnvToBase(this.proxy, this.localVars,
      ...envFiles.filter(f => f),
      process.env)
  }
}
