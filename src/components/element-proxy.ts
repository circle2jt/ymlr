import { type Scene } from 'src/components/scene/scene'
import { callFunctionScript } from 'src/libs/async-function'
import { GlobalEvent } from 'src/libs/global-event'
import { type Logger } from 'src/libs/logger'
import { GetLoggerLevel, type LoggerLevel } from 'src/libs/logger/logger-level'
import { isGetEvalExp } from 'src/libs/variable'
import { type Element } from './element.interface'
import { Group } from './group/group'
import { type GroupItemProps } from './group/group.props'
import { type RootScene } from './root-scene'
import { Returns } from './scene/returns'
import { type VarsProps } from './vars.props'

const EVAL_ELEMENT_SHADOW_BASE_PROPS = [
  'name'
]

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
  /** |**  force
    Try to execute and ignore error in the running
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - force: true
        name: Got error "abc is not defined" but it should not stop here ${abc}

      - name: Keep playing
    ```
  */
  force?: boolean | string
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
  /** |**  debug
    How to print log details for each of item.
    Default is `info`
    Value must be in:
      - `true`: is `debug`
      - `all`: Print all of debug message
      - `trace`: Print all of debug message
      - `debug`: Print short of debug
      - `info`: Print name, description without log details
      - `warn`: Only show warning debug
      - `error`: Only show error debug
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
  debug?: LoggerLevel
  /** |**  vars
    - Set value in the item to global vars to reused later
    - Declare and set value to variables to reused in the scene/global scope
    - If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
    - If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene
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
    Loop to run items with a condition
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
          - echo: item value is ${this.parent.loopValue}
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

  #parentState?: Record<string, any>
  get parentState() {
    if (this.#parentState !== undefined) return this.#parentState
    return this.parentProxy?.parentState
  }

  set parentState(parentState: Record<string, any> | undefined) {
    this.#parentState = parentState
  }

  tag!: string
  loopKey?: any
  loopValue?: any

  readonly parent?: Element

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
    return this.context || this.tag
  }

  get isSkipNext() {
    return this.skipNext === null || !!this.skipNext
  }

  #logger?: Logger
  get logger(): Logger {
    if (!this.#logger) {
      this.#logger = (this.parentProxy || this.rootSceneProxy).logger.clone(this.contextName, this.debug)
    }
    return this.#logger
  }

  set logger(logger: Logger) {
    this.#logger = logger
  }

  result?: any
  error?: Error

  #elementAsyncProps?: any

  constructor(public element: T, props = {}) {
    Object.assign(this, props)
    if (element.asyncConstructor) this.#elementAsyncProps = props
    const wf = new WeakRef(this)
    Object.defineProperties(element, {
      proxy: {
        get() {
          return wf.deref()
        }
      }
    })
  }

  setDebug(debug?: string) {
    if (!debug) return
    this.debug = GetLoggerLevel(debug)
    this.#logger?.setLevel(this.debug)
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
    const elem = this.element
    const proms = Object.keys(elem)
      .filter(key => {
        return !elem.ignoreEvalProps?.includes(key) &&
          // @ts-expect-error never mind
          isGetEvalExp(elem[key])
      }).map(async key => {
        // @ts-expect-error never mind
        elem[key] = await this.scene.getVars(elem[key], this)
      })
    const baseProps = Object.keys(this)
    proms.push(...baseProps
      .filter(key => {
        return EVAL_ELEMENT_SHADOW_BASE_PROPS.includes(key) &&
          // @ts-expect-error never mind
          isGetEvalExp(this[key])
      }).map(async key => {
        // @ts-expect-error never mind
        this[key] = await this.scene.getVars(this[key], this)
      }))
    proms.length && await Promise.all(proms)
  }

  injectOtherCxt(ctx: ElementProxy<Element> | any, others: Record<string, any> = {}) {
    if (ctx instanceof ElementProxy) {
      Object.assign(others, {
        $loopKey: ctx.loopKey,
        $loopValue: ctx.loopValue,
        $parentState: ctx.parentState
      })
    }
  }

  async callFunctionScript(script: string, others: Record<string, any> = {}) {
    this.injectOtherCxt(this, others)
    const rs = await callFunctionScript(script, this, {
      $vars: this.scene.localVars,
      $utils: this.rootScene?.globalUtils,
      ...others
    })
    return rs
  }

  async exec(parentState?: Record<string, any>) {
    if (parentState !== undefined) this.parentState = parentState
    if (this.element.asyncConstructor) {
      await this.element.asyncConstructor(this.#elementAsyncProps)
      this.#elementAsyncProps = undefined
      this.element.asyncConstructor = undefined
    }

    GlobalEvent.emit('@app/proxy/before:exec:exec', this)

    const isAddIndent = this.parentProxy?.name !== undefined
    if (isAddIndent) {
      this.logger.addIndent()
    }
    try {
      try {
        await this.evalPropsBeforeExec()
        if (this.name && !this.$.hideName) {
          this.logger.info(this.element instanceof Group ? '▼' : '▸', this.name)
        }
        if (this.element.preExec) {
          const isRunOnce = await this.element.preExec(parentState)
          if (isRunOnce) {
            this.element.preExec = undefined
          }
        }
        const result = await this.element.exec(parentState)
        if (this.result instanceof Returns) this.result = this.result.result
        else this.result = result
      } catch (err: any) {
        this.error = err
        if (!this.force) {
          throw err
        }
        this.logger.warn('%o', err)
        return
      }
      await this.setVarsAfterExec()
    } finally {
      if (isAddIndent) {
        this.logger.removeIndent()
      }
      GlobalEvent.emit('@app/proxy/after:exec', this)
    }
    return this.result
  }

  async dispose() {
    GlobalEvent.emit('@app/proxy/before:exec:dispose', this)
    try {
      await this.element.dispose?.()
      this.parentState = undefined
      this.logger = undefined as any
    } finally {
      GlobalEvent.emit('@app/proxy/after:dispose', this)
    }
  }
}
