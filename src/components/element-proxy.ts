import { isAbsolute, join } from 'path'
import { type Scene } from 'src/components/scene/scene'
import { callFunctionScript } from 'src/libs/async-function'
import { type ErrorStack } from 'src/libs/error-stack'
import { GlobalEvent } from 'src/libs/global-event'
import { type Logger } from 'src/libs/logger'
import { LevelFactory } from 'src/libs/logger/level-factory'
import { GetLoggerLevel, type LoggerLevel } from 'src/libs/logger/logger-level'
import { sleep } from 'src/libs/time'
import { isGetEvalExp } from 'src/libs/variable'
import { Constants } from 'src/managers/constants'
import { type Element } from './element.interface'
import { type GroupItemProps } from './group/group.props'
import { type RootScene } from './root-scene'
import { Returns } from './scene/returns'
import { type VarsProps } from './vars.props'

const ICON_MULTIPLE_STEP = '' // '▼'
const ICON_SINGLE_STEP = '' // '▸'

const REGEX_VALIDATE_VARS_NAME = /^[a-zA-Z0-9]/
const DEFAULT_AUTO_EVAL_BASE_PROPS = new Set(['name', 'failure'])
const DEFAULT_IGNORE_EVAL_ELEMENT_PROPS = new Set([
  // Injected enumerable: false by system
  // 'proxy',
  // 'innerRunsProxy',

  // Injected by user so neec to ignore handle them
  'hideName',
  'ignoreEvalProps',
  'runs',
  'errorStack'
])

export class ElementProxy<T extends Element> {
  /** |**  id
    ID Reference to element object in the $vars
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - id: echo1
        echo: Hello

      - exec'js: |
          this.logger.debug($vars.echo1.content)

    ```
  */
  id?: string
  /** |**  ->
    Expose item properties for others extends
    @position top
    @tag It's a property in a tag
    @example
    Use `skip`
    ```yaml
      - ->: helloTemplate
        skip: true
        echo: Hello               # Not run

      - <-: helloTemplate         # => Hello

    ```

    Use `template`
    ```yaml
      - ->: hiTemplate
        template: Hi              # Not run

      - <-: hiTemplate            # => Hi
        echo:
    ```
  */
  '->'?: string
  /** |**  <-
    Copy properties from others (a item, or list items)
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - ->: baseRequest
        template:
          baseURL: http://localhost
      - <-: baseRequest
        ->: user1Request
        template:
          headers:
            authorization: Bearer user1_token
      - ->: user2RequestWithoutBaseURL
        template:
          headers:
            authorization: Bearer user2_token

      - <-: user1Request
        http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user1_token"
          url: /posts
        vars: user1Posts

      - <-: [baseRequest, user2RequestWithoutBaseURL]
        http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user2_token"
          url: /posts
        vars: user2Posts
    ```
  */
  '<-'?: string | string[]
  /** |**  template
    Declare a template to extends later
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - ->: localhost           # Auto skip, not run it
        template:
          baseURL: http://localhost:3000

      - <-: localhost           # => Auto inherits "baseURL" from localhost
        http'get:
          url: /items
    ```
  */
  template?: any
  /** |**  skip
    No run this
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo: Hi                   # Print "hi"

      - skip: true
        echo: Hello                # No print "Hello"

      - echo: world                # Print "world"
    ```
  */
  skip?: boolean
  /** |**  only
    Only run this
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo: Hi                   # No print "hi"

      - only: true
        echo: Hello                # Only print "Hello"

      - echo: world                # No print "world"

      - only: true
        echo: Bye                  # Only print "Bye"
    ```
  */
  only?: boolean
  /** |**  failure
    Handle error when do something wrong. Default it will exit app when something error.
    - ignore: Ignore error then keep playing the next
    - restart:
        max: 3     When got something error, it will be restarted automatically ASAP (-1/0 is same)
        sleep: 3000
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - failure:
          restart:                     # Try to restart 3 time before exit app. Each of retry, it will be sleep 3s before restart
            max: 3
            sleep: 3s
        js: |
          const a = 1/0
      - failure:
          ignore: true                 # Ignore error then play the next
        js: |
          const a = 1/0
    ```
  */
  failure?: {
    ignore?: boolean
    logDetails?: boolean
    restart?: {
      max: number
      sleep: number | string
    }
  }

  /** |**  context
  Context logger name which is allow filter log by cli "ymlr --debug-context context_name=level --"
  @position top
  @tag It's a property in a tag
  @example
  ```yaml
    - name: Get list user
      context: userapi
      debug: warn
      http'get: ...

    - name: Get user details
      context: userapi
      debug: warn
      http'get: ...

    - name: Get product details
      context: productapi
      debug: warn
      http'get: ...
  ```
  Now, we have 2 choices to debug all of user APIs and product APIs
  1. Replace all "debug: warn" to "debug: debug"
  2. Only run cli as below
  ```sh
    ymlr --debug-context userapi=debug --debug-context productapi=trace -- $SCENE_FILE.yaml
  ```
*/
  context?: string
  /** |**  icon
    Icon which is prepended before the step name
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - ->: sleepID
        icon: ⏳
        template: 1000

      - name: Sleep in 1s       # => ⏳ Sleep in 1s
        <-: sleepID
        sleep: 1s

      - name: Sleep in 2s       # => ⏳ Sleep in 2s
        <-: sleepID
        sleep: 2s
    ```
  */
  icon?: string
  /** |**  name
    Step name
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - name: Sleep in 1s
        sleep: 1000
    ```
  */
  name?: string

  /* _name
    No print step name when running but print step name in preview mode
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - _name: Sleep in 1s
        sleep: 1000
    ```
  */
  // _name?: string

  /** |**  debug
    How to print log details for each of item.
    Default is `info`
    Value must be in:
      - `true`: is `debug`
      - `all`: Same `trace`
      - `trace`: Print all of messages
      - `debug`: Print of `debug`, `info`, `warn`, `error`, `fatal` messages
      - `info`: Print `info`, `warn`, `error`, `fatal` messages
      - `warn`: Print `warn`, `error`, `fatal` messages
      - `error`: Print `error`, `fatal` messages
      - `fatal`: Print `fatal` messages
      - `secret`: Only show secret log. Example config, password, keys...
      - `silent`: Not print anything
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - name: Get data from a API
        debug: debug
        http'get:
          url: http://...../data.json
    ```
  */
  debug?: LoggerLevel | boolean
  /** |**  vars
    - Set value in the item to global vars to reused later
    - Declare and set value to variables to reused in the scene/global scope
    - If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
    - If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene
    Variables:
      - `$v`, `$vars`: Reference to variables
    @position top
    @tag It's a property in a tag
    @example
    A main scene file
    ```yaml
      - echo: Hello world
        vars: helloText             # Save output from echo to global variable "helloText"
      - echo: ${$vars.helloText}    # => Hello world

      - vars:
          MainName: global var      # Is used in all of scenes
          mainName: local var       # Only used in this scene

      - scene:
          path: ./child.scene.yaml

      - fetch'get:
          url: http://localhost/data.json
        vars:
          myResponseData: ${ this.$.response.data }                         # Assign response data to scene variable
          MyResponseData: ${ this.$.response.data }                         # Assign response data to global variable
          _: ${ $parentState.responseDataInContext = this.$.response.data } # Assign response data to context variable

      - echo: ${$vars.MainName}      # => global var
      - echo: ${$vars.mainName}      # => local var
      - echo: ${$vars.name}          # => undefined
      - echo: ${$vars.Name}          # => global name here
    ```
    A scene file `child.scene.yaml` is:
    ```yaml
      - vars:
          Name: global name here
          name: scene name here     # Only used in this scene

      - echo: ${$vars.MainName}      # => global var
      - echo: ${$vars.mainName}      # => undefined
      - echo: ${$vars.name}          # => scene name here
      - echo: ${$vars.Name}          # => global name here
    ```
  */
  vars?: VarsProps
  /** |**  loop
    Loop to run items with a condition.
    Variables:
      - `$lv`, `$loopValue`: Get loop value
      - `$lk`, `$loopKey`: Get loop key
    @position top
    @tag It's a property in a tag
    @example
    Loop in array
    ```yaml
      - vars:
          arrs: [1,2,3,4]
      - loop: ${$vars.arrs}
        echo: Index is ${$loopKey}, value is ${$loopValue}    # $loopKey ~ this.loopKey AND $loopValue ~ this.loopValue
      # =>
      # Index is 0, value is 1
      # Index is 1, value is 2
      # Index is 2, value is 3
      # Index is 3, value is 4
    ```

    Loop in object
    ```yaml
      - vars:
          obj: {
            "name": "thanh",
            "sex": "male"
          }
      - loop: ${$vars.obj}
        echo: Key is ${$loopKey}, value is ${$loopValue}
      # =>
      # Key is name, value is thanh
      # Key is sex, value is male
    ```

    Dynamic loop in a condition
    ```yaml
      - vars:
          i: 0
      - loop: ${$vars.i < 3}
        echo: value is ${$vars.i++}
      # =>
      # value is 0
      # value is 1
      # value is 2
    ```

    Loop in nested items
    ```yaml
      - vars:
          arrs: [1,2,3]
      - loop: ${$vars.arrs}
        name: group ${$loopValue}
        runs:
          - echo: value is ${$loopValue}                                  # => item value is "1" then "2" then "3"

          - loop: ${ [4,5,6] }
            runs:
              - echo: value is ${$loopValue}                              # => item value is "4" then "5" then "6"

              - echo: parent is ${this.parentProxy.parentProxy.loopValue} # => item value is "1" then "2" then "3"
      # =>
      # group 1
      # item value is 1
    ```
  */
  loop?: string | object[] | object
  /** |**  else
    Check condition before run the item and skip the next cases when it passed
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - vars:
          number: 11

      - if: ${$vars.number === 11}
        echo: Value is 11                   # => Value is 11

      - elseif: ${$vars.number > 10}
        echo: Value is greater than 10      # =>

      - else:
        echo: Value is lessthan than 10     # =>

      - echo: Done                          # => Done
    ```
  */
  else?: null
  /** |**  elseif
    Check condition before run the item and skip the next cases when it passed
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - vars:
          number: 11

      - if: ${$vars.number === 11}
        echo: Value is 11                   # => Value is 11

      - elseif: ${$vars.number > 10}
        echo: Value is greater than 10      # =>

      - elseif: ${$vars.number < 10}
        echo: Value is lessthan than 10     # =>

      - echo: Done                          # => Done
    ```
  */
  elseif?: boolean | string
  /** |**  if
    Check condition before run the item
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - vars:
          number: 11

      - if: ${$vars.number === 11}
        echo: Value is 11                   # => Value is 11

      - if: ${$vars.number > 10}
        echo: Value is greater than 10      # => Value is greater than 10

      - if: ${$vars.number < 10}
        echo: Value is lessthan than 10     # =>

      - echo: Done                          # => Done
    ```
  */
  if?: boolean | string
  /** |**  detach
    Push the tag execution to background jobs to run async, the next steps will be run ASAP. Before the program is exited, it will be released
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - name: job1
        detach: true
        loop: ${[1,2,3]}
        runs:
          - echo: Hello ${this.parentProxy.loopValue}
          - sleep: 1s
      - name: job2
        echo: first
      - name: job3
        echo: second
    ```
    In above example, job2, job3 will run step by step, but job1 run in background, the program will wait job1 done then finish the program
  */
  detach?: boolean | string
  /** |**  skipNext
    Skip the next steps in the same parent group when done this
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - loop: ${ [1,2,3] }
        runs:
          - echo: begin                                          # Always print begin

          - echo: ${ this.parentProxy.loopValue }
            skipNext: ${ this.parentProxy.loopValue === 2 }      # When $loopValue is 2, skip the next step

          - echo: end                                            # Only print end when $loopValue is not equals 2
    ```
  */
  skipNext?: boolean | string
  /** |**  async
    Execute parallel tasks
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - async: true
        http'get:
          url: /categories
        vars: categories
      - ~http'get:            # Can use shortcut by add "~"" before tag name
          url: /product/1
        vars: product

      - name: The product ${$vars.product.name} is in the categories ${$vars.categories.map(c => c.name)}
    ```
  */
  async?: boolean | string
  /** |**  runs
    Steps will be run in the running element
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - http'server:
          address: 0.0.0.0:1234
        runs:
          - echo: Do something when a request comes
          - echo: Do something when a request comes...
          ...

    ```
  */
  runs?: GroupItemProps[]

  _forceStop?: true
  #parentState?: WeakRef<Record<string, any>> | null
  /** |**  parentState
    - Set/Get value to context variables. Used in tags support `runs` and support parentState
    Variables:
      - `$ps`, `$parentState`: Reference to context state
    @position top
    @tag It's used in js code
    @example
    ```yaml
      - name: listen to handle an events
        event'on:
          name: test-event
        runs:
          - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
          - echo: ${ $ps.eventOpts }            # => [ params 1, params 2 ]

      - event'emit:
          name: test-event
          data:
            name: Test event
            data: Hello
          opts:
            - params 1
            - params 2
    ```
    Acess $parentState incursive
    ```yaml
      - name: Connect to redis
        ymlr-redis:
          uri: redis://localhost:6379
        runs:
          - name: access redis
            js: |
              await $ps.redis.client.publish('test-event/ping', 'level 1')

          - name: after redis is connected, start listening to handle an events
            event'on:
              name: test-event
            runs:
              - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
              - echo: ${ $ps.eventOpts }            # => [ params 1, params 2 ]

              - name: access redis
                js: |
                  await $ps.$ps.redis.client.publish('test-event/ping', 'level 2')

      - event'emit:
          name: test-event
          data:
            name: Test event
            data: Hello
          opts:
            - params 1
            - params 2
    ```
  */
  get parentState(): Record<string, any> | undefined {
    if (this.#parentState) {
      return this.#parentState.deref()
    }
    return this._creator?.proxy.parentState
  }

  set parentState(parentState: Record<string, any> | undefined) {
    this.#parentState = parentState ? new WeakRef(parentState) : null
  }

  _curDir?: string

  get curDir(): string {
    return this._curDir || this.parentProxy?.curDir as string
  }

  set curDir(p: string) {
    this._curDir = p
  }

  /** |**  Prefix path
    Prefix path which is support in all of tags.
    Can used in code by: proxy.getPath(pathOfFile: string)
    @position top
    @tag Global Notes
    @example
    ```sh
      cd /app
      yaml /scene/my-root-scene.yaml
    ```
    - `~~/`: map to run dir `/app/`
    -  `~/`: map to root scene dir `/scene/`
    - `~./`: map to current scene dir
    -  `../`: map to parent directory of the current working file
    -  `./`: map to directory of the current working file
    -   `/`: absolute path
  */
  getPath(p: string) {
    if (!p) return p
    if (p.startsWith('~~/')) return join(this.rootScene.runDir, p.substring(3))
    if (p.startsWith('~./')) return join(this.sceneProxy.curDir, p.substring(2))
    if (p.startsWith('~/')) return join(this.rootScene.rootDir, p.substring(2))
    if (p.startsWith('../')) return join(this.curDir, '..', p.substring(3))
    if (p.startsWith('./')) return join(this.curDir, p.substring(2))
    if (isAbsolute(p)) return p
    return p
  }

  tag!: string
  _loopObject?: {
    loopKey?: any
    loopValue: any
  }

  get loopObject(): any {
    return this._loopObject ?? this.parentProxy?.loopObject
  }

  get loopKey(): any {
    return this.loopObject?.loopKey
  }

  get loopValue(): any {
    return this.loopObject?.loopValue
  }

  readonly parent?: Element
  errorStack?: ErrorStack

  readonly _creator?: Element
  get parentProxy() {
    return this.parent?.proxy
  }

  readonly scene!: Scene

  get sceneProxy() {
    return this.scene?.proxy
  }

  readonly rootScene!: RootScene

  get rootSceneProxy() {
    return this.rootScene?.proxy
  }

  get $() {
    return this.element
  }

  get contextName() {
    return this.context || `@${this.tag}`
  }

  get isSkipNext() {
    return this.skipNext === null || !!this.skipNext
  }

  private _logger?: Logger | null
  get logger(): Logger {
    if (!this._logger) {
      this._logger = (this.parentProxy || this.rootSceneProxy).logger.clone(this.contextName, this.debug, this.errorStack)
    }
    return this._logger
  }

  // TODO: need to update others plugins before remove it
  set logger(logger: Logger) {
    this._logger = logger
  }

  get contextExpose() {
    return {
      $loopKey: this.loopKey,
      $loopValue: this.loopValue,
      $parentState: this.parentState,
      $lk: this.loopKey,
      $lv: this.loopValue,
      $ps: this.parentState
    }
  }

  result?: any
  error?: Error

  #elementAsyncProps?: any

  constructor(public element: T, props: any = {}) {
    Object.assign(this, props)
    Object.defineProperty(element, 'proxy', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: this
    })
    if (element.asyncConstructor) this.#elementAsyncProps = props
  }

  setDebug(debug?: string) {
    if (!debug) return
    this.debug = GetLoggerLevel(debug)
    if (this._logger) {
      this._logger.level = LevelFactory.GetInstance(this.debug)
    }
  }

  getParentByClassName<T extends Element>(...ClazzTypes: Array<new (...args: any[]) => T>): ElementProxy<T> | undefined {
    let parentElement: Element | undefined = this.parent
    while (parentElement) {
      if (ClazzTypes.some(ClazzType => parentElement instanceof ClazzType)) {
        return parentElement.proxy as ElementProxy<T>
      }
      parentElement = parentElement.proxy.parent
    }
    return undefined
  }

  async setVarsAfterExec() {
    if (this.vars) {
      const keys = await this.scene.setVars(this.vars, this.result, this)
      if (!keys?.length) return
      this.logger.trace('[vars] \t%j', keys.reduce<Record<string, any>>((sum, e) => {
        sum[e] = this.scene.localVars[e]
        return sum
      }, {}))
    }
  }

  async evalPropsBeforeExec() {
    const that = this as any
    const { element } = that
    const proms = Object.keys(element)
      .filter(key =>
        REGEX_VALIDATE_VARS_NAME.test(key) &&
        !DEFAULT_IGNORE_EVAL_ELEMENT_PROPS.has(key) &&
        !this.element.ignoreEvalProps?.includes(key) &&
        isGetEvalExp(element[key])
      )
      .map(async key => {
        element[key] = await this.scene.getVars(element[key], this)
      })
    const baseProps = Object.keys(this)
    proms.push(...baseProps
      .filter(key =>
        DEFAULT_AUTO_EVAL_BASE_PROPS.has(key) &&
        isGetEvalExp(that[key])
      )
      .map(async key => {
        that[key] = await this.scene.getVars(that[key], this)
      }))
    if (proms.length) {
      await Promise.all(proms)
    }
  }

  async callFunctionScript(script: string, others: Record<string, any> = {}) {
    const rs = await callFunctionScript(script, this, {
      ...others,
      ...this.contextExpose,
      $vars: this.scene.localVars,
      $utils: this.rootScene.globalUtils,
      $const: Constants,
      $env: process.env,

      $v: this.scene.localVars,
      $u: this.rootScene.globalUtils,
      $c: Constants,
      $e: process.env
    })
    return rs
  }

  async exec(_parentState?: Record<string, any>) {
    if (this.element.asyncConstructor) {
      await this.element.asyncConstructor(this.#elementAsyncProps)
      this.#elementAsyncProps = undefined
      // this.#ignoreEvalElementProps.clear()
      this.element.asyncConstructor = undefined
    }

    GlobalEvent.emit('@app/proxy/before:exec:exec', this)

    const isAddIndent = this.parentProxy?.logger.meta?.printedName
    if (isAddIndent) this.logger.emit('addIndent')
    try {
      try {
        await this.evalPropsBeforeExec()
        if (this.name && !this.element.hideName) {
          if (this.logger.info(`${this.runs?.length ? ICON_MULTIPLE_STEP : ICON_SINGLE_STEP}${this.icon ? `${this.icon} ` : ''}${this.name}`)) {
            this.logger.meta = { printedName: true }
          }
        }
        do {
          try {
            const isRunOnce = await this.element.preExec?.(this.parentState)
            if (isRunOnce) {
              this.element.preExec = undefined
            }
            const result = await this.element.exec(this.parentState)
            if (this.result instanceof Returns) {
              this.result = this.result.result
            } else {
              this.result = result
            }
            break
          } catch (_err: any) {
            let err: any
            if (typeof _err === 'string') {
              err = new Error(_err)
            } else {
              err = _err
            }
            if (this.name && !err.proxyName) {
              err.proxyName = this.name
            }
            if (!this.failure?.restart || --this.failure.restart.max === 0) {
              throw err
            }
            if (this.failure?.logDetails) {
              this.logger.error(err)
            } else {
              this.logger.error(err?.message)?.trace(err)
            }
            await sleep(this.failure.restart.sleep)
          }
        } while (true)
      } catch (err: any) {
        if (this.name && !err.proxyName) {
          err.proxyName = this.name
        }
        this.error = err
        if (!this.failure?.ignore) {
          throw err
        }
        this.logger.warn(this.failure?.logDetails ? err : err?.message)?.trace(err)
        return
      }
      await this.setVarsAfterExec()
    } finally {
      if (isAddIndent) this.logger.emit('removeIndent')
      GlobalEvent.emit('@app/proxy/after:exec', this)
    }
    return this.result
  }

  async dispose() {
    if (this._logger === null) return
    GlobalEvent.emit('@app/proxy/before:exec:dispose', this)
    try {
      await this.element.innerRunsProxy?.dispose()
      await this.element.dispose?.()
      this._logger?.dispose()
      this._logger = null
      // Only release parentState if it's owner
      if (this.#parentState) {
        this.#parentState = null
      }
    } finally {
      GlobalEvent.emit('@app/proxy/after:dispose', this)
    }
  }
}

export class BaseElementProxy<T extends Element> extends ElementProxy<T> {
  constructor(public element: T, props: any = {}) {
    super(element, props)
  }

  override async exec(parentState?: Record<string, any>) {
    const rs = await this.element.exec(parentState)
    return rs
  }

  override async dispose() {
    await this.element.dispose()
  }
}
