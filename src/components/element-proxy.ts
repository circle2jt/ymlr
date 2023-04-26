import { RootScene } from 'src/components/root-scene'
import { Scene } from 'src/components/scene/scene'
import { callFunctionScript } from 'src/libs/async-function'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { isGetEvalExp } from 'src/libs/variable'
import { Element } from './element.interface'
import { Returns } from './scene/returns'
import { VarsProps } from './vars/vars.props'

const IGNORE_EVAL_ELEMENT_SHADOW_BASE_PROPS = [
  'name', 'id', 'skip', 'force', 'debug', '_parentState', 'preScript', 'postScript'
]

export class ElementProxy<T extends Element> {
  /** |**  id
    ID Reference to element object in the $vars
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - id: echo1
        skip: true
        echo: Hello               # Not run

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
    Only init but not execute
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - ->: helloTemplate
        skip: true
        echo: Hello                # Not run

      - <-: helloTemplate
        echo: Hi                   # => Hi
    ```
  */
  skip?: boolean
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
    Set value in the item to global vars to reused later
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo: Hello world
        vars: helloText
      - echo: ${$vars.helloText}     # => Hello world
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
  /** |**  if
    Check condition before run the item
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - vars:
          number: 11
      - if: ${$vars.number > 10}
        echo: Value is greater than 10      # => Value is greater than 10

      - if: ${$vars.number < 10}
        echo: Value is lessthan than 10     # No print
    ```
  */
  if?: boolean | string
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
      - async: true
        http'get:
          url: /product/1
        vars: product

      - name: The product ${$vars.product.name} is in the categories ${$vars.categories.map(c => c.name)}
    ```
  */
  async?: boolean | string
  /** |**  preScript
    Execute a script before run
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - preScript: |                                # => Prepare data
          console.log('Prepare data')               # => Execute here
        echo: Execute here
    ```
  */
  preScript?: string

  /** |**  postScript
    Execute a script before run
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo: Execute here                           # => Execute here
        postScript: |                                # => Do something after executed
          console.log('Do something after executed')

    ```
  */
  postScript?: string

  private _parentState?: Record<string, any>

  get parentState() {
    if (this._parentState !== undefined) return this._parentState
    return this.parentProxy?.parentState
  }

  set parentState(parentState: Record<string, any> | undefined) {
    this._parentState = parentState
  }

  tag!: string
  loopKey?: any
  loopValue?: any

  parent?: Element
  get parentProxy() {
    return this.parent?.proxy
  }

  scene!: Scene
  get sceneProxy() {
    return this.scene.proxy
  }

  rootScene!: RootScene
  get rootSceneProxy() {
    return this.rootScene?.proxy
  }

  get $() {
    return this.element
  }

  private _logger?: Logger
  private get loggerLevel(): LoggerLevel {
    return this?.debug || this.parentProxy?.loggerLevel || this.rootScene?.proxy.logger.levelName || LoggerLevel.ALL
  }

  get logger(): Logger {
    return this._logger || (this._logger = (this.parentProxy || this.rootSceneProxy).logger.clone(this.tag, this.loggerLevel))
  }

  set logger(logger: Logger) {
    this._logger = logger
  }

  result?: any
  error?: Error

  private get ignoreEvalPropsKeys() {
    return this.element.ignoreEvalProps
  }

  private readonly elementAsyncProps?: any

  constructor(public element: T, props = {}) {
    Object.assign(this, props)

    if (this.element.asyncConstructor) this.elementAsyncProps = props
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    Object.defineProperties(this.element, {
      proxy: {
        value: this,
        writable: false
      }
    })
  }

  setDebug(debug: LoggerLevel) {
    this.debug = debug
    this._logger?.setLevel(this.debug)
  }

  getParentByClassName<T extends Element>(...ClazzTypes: Array<new (...args: any[]) => T>): ElementProxy<T> | undefined {
    let parent: Element | undefined = this.parent
    while (parent) {
      if (ClazzTypes.some(ClazzType => parent instanceof ClazzType)) {
        return parent.proxy as ElementProxy<T>
      }
      parent = parent?.proxy.parent
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
    const props = Object.keys(elem)
    const proms = props
      .filter(key => {
        return !this.ignoreEvalPropsKeys?.includes(key) &&
          // @ts-expect-error
          isGetEvalExp(elem[key])
      }).map(async key => {
        // @ts-expect-error
        elem[key] = await this.scene.getVars(elem[key], this)
      })
    const baseProps = Object.keys(this)
    proms.push(...baseProps
      .filter(key => {
        return IGNORE_EVAL_ELEMENT_SHADOW_BASE_PROPS.includes(key) &&
          // @ts-expect-error
          isGetEvalExp(this[key])
      }).map(async key => {
        // @ts-expect-error
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

  async exec(parentState?: any) {
    if (parentState !== undefined) this.parentState = parentState
    // Object.defineProperty(this, 'parentState', {
    //   get() {
    //     return parentState
    //   }
    // })
    if (this.elementAsyncProps && this.element.asyncConstructor) await this.element.asyncConstructor(this.elementAsyncProps)

    this.rootScene?.event.emit('element/exec:before', this)

    let isAddIndent: boolean | undefined
    try {
      try {
        await this.evalPropsBeforeExec()

        isAddIndent = this.logger.is(LoggerLevel.INFO) && this.parentProxy?.name !== undefined
        if (isAddIndent) this.logger.addIndent()

        this.name && this.logger.info('%s', this.name)
        if (this.preScript) {
          await this.callFunctionScript(this.preScript)
        }
        const result = await this.element.exec(parentState)
        if (this.result instanceof Returns) this.result = this.result.result
        else this.result = result
      } catch (err: any) {
        this.error = err
        if (!this.force) throw err
        this.logger.warn('%o', err)
        return
      } finally {
        if (isAddIndent) this.logger.removeIndent()
      }
      await this.setVarsAfterExec()
      if (this.postScript) {
        await this.callFunctionScript(this.postScript)
      }
    } finally {
      this.rootScene?.event.emit('element/exec:end', this)
    }
    return this.result
  }

  dispose() {
    return this.element.dispose()
  }
}
