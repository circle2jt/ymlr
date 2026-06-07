import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { basename, dirname, join, resolve } from 'path'
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

  readonly localCaches = new Map<string, any[]>()

  protected readonly password?: string
  protected override get innerScene() {
    return this
  }

  private readonly content?: string
  #localVars!: { proxy: Record<string, any>, revoke: () => void }
  set localVars(vars: Record<string, any>) {
    this.#localVars = Proxy.revocable(vars, {
      get: (target: any, name: any) => {
        if (!REGEX_FIRST_UPPER.test(name[0])) {
          return target[name]
        }
        return this.proxy.rootScene.localVars[name]
      },
      has: (target: any, name: any) => {
        if (!REGEX_FIRST_UPPER.test(name[0])) {
          return name in target
        }
        return name in this.proxy.rootScene.localVars
      },
      set: (target: any, name: any, vl: any) => {
        if (!REGEX_FIRST_UPPER.test(name[0])) {
          target[name] = vl
          return true
        }
        this.proxy.rootScene.localVars[name] = vl
        return true
      },
      deleteProperty: (target: any, name: any) => {
        if (!REGEX_FIRST_UPPER.test(name[0])) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete target[name]
          return true
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.proxy.rootScene.localVars[name]
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
    this.content = content
    globalThis.copyProps(this, { path, vars })
    this.ignoreEvalProps.push('curDir', 'password', 'templatesManager')
  }

  async asyncConstructor() {
    globalThis.copyProps(this.templatesManager, this.scene.templatesManager)
    await this.handleFile()
  }

  async handleFile() {
    const remoteFileRawProps = await this.getRemoteFileProps()
    if (Array.isArray(remoteFileRawProps)) {
      this.lazyInitRuns(remoteFileRawProps)
    } else {
      const { password, env, envFiles, ...remoteFileProps } = remoteFileRawProps

      const envObject: any = {}

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
          globalThis.copyProps(envObject, Env.ParseEnvContent(content, true))
        }
      }

      if (env) {
        this.logger.debug('Loading env')
        if (Array.isArray(env)) {
          (env as string[]).forEach(line => {
            const [key, value] = Env.ParseEnvLine(line, true)
            envObject[key] = value
          })
        } else if (typeof env === 'object') {
          Object.entries(env).forEach(([key, value]) => {
            envObject[key] = value as string
          })
        }
      }

      process.env = merge(envObject, process.env)

      LoggerFactory.LoadFromEnv()
      if (password) {
        await this.generateEncryptedFile(remoteFileProps, password)
      }
      const { name: _name, debug: _debug, vars: _vars, varsFiles: _varsFiles, ...groupProps } = remoteFileProps
      await this.loadVars(_vars, [], [])
      const { name, debug, vars, varsFiles = [] } = await this.getVars({ name: _name, debug: _debug, vars: _vars, varsFiles: _varsFiles }, this.proxy)
      if (!this.proxy.debug && debug) this.proxy.setDebug(debug)
      if (this.name === undefined && name) this.name = name
      if (this.isRootScene) this.lazyInitRuns({ runs: [groupProps] })
      else this.lazyInitRuns(groupProps)

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

  override async exec() {
    if (this.name) this.logger.info(this.name)
    const results = await super.exec()
    return results || []
  }

  override async dispose() {
    this.localCaches.clear();
    (this.templatesManager as any) = null
    if (this.#localVars) {
      this.#localVars.revoke();
      (this.#localVars as any).proxy = null;
      (this.#localVars as any) = null
    }
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
    globalThis.copyProps(this.localVars, obj)
  }

  protected async getRemoteFileProps() {
    let props: any
    this.path = await this.scene.getVars(this.path)
    let fileRemote: FileRemote | undefined
    let content = this.content
    if (!content && this.path) {
      if (this.isRootScene) this.proxy.curDir = resolve('.')
      fileRemote = new FileRemote(this.path, this.proxy.parentProxy || this.proxy || null)
      if (!fileRemote.isRemote) {
        this.path = fileRemote.uri
        const dirPath = dirname(this.path)
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
    const tempProps = ids.reverse().reduce<any>((rs, id) => {
      const cached = this.templatesManager[id]
      if (!cached) {
        throw new Error(`Could not found element with id "${id}"`)
      }
      const { tagName: _tagName, ...newProps } = cloneDeep(cached)
      if (!tagName) {
        tagName = _tagName
      }
      merge(rs, newProps)
      return rs
    }, {})

    if (tagName) {
      tempProps[tagName] = tempProps.props
      if (baseProps.props !== undefined && baseProps[tagName] === undefined) {
        baseProps[tagName] = baseProps.props
      }
      tempProps.props = baseProps.props = undefined
    }
    merge(tempProps, baseProps)
    if (tempProps.placeholder) {
      if (tempProps.runs?.length) replace3Dots(tempProps.runs, tempProps.placeholder)
      if (tempProps.catch?.length) replace3Dots(tempProps.catch, tempProps.placeholder)
      if (tempProps.finally?.length) replace3Dots(tempProps.finally, tempProps.placeholder)
    }
    return tempProps
  }

  export(tagName: string | undefined, allProps: any, id: string) {
    if (!id) return
    // No clone erroStask...
    const { errorStack, elseif: elseIfCondition, else: elseCondition, template, ...props } = allProps
    const newOne = cloneDeep(props)
    if (tagName) {
      newOne.tagName = tagName
      if (newOne[tagName] !== undefined) {
        newOne.props = newOne[tagName]
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

function replace3Dots(runs: any[], placeholder?: Record<string, any>) {
  if (!runs?.length || !placeholder) return
  const cleanKeys = new Set<string>()
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    if (typeof run === 'string') {
      if (placeholder[run] == null) throw new Error(`Placeholder "${run}" is required!`)
      cleanKeys.add(run)
      const newRuns = placeholder[run]
      if (Array.isArray(newRuns)) {
        runs.splice(i, 1, ...newRuns)
      } else {
        runs.splice(i, 1, newRuns)
      }
      continue
    }
    if (!run.runs?.length) continue
    replace3Dots(run.runs, placeholder)
  }
  cleanKeys.forEach(key => {
    placeholder[key] = undefined
  })
}
