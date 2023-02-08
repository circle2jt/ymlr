import { VarsProps } from './vars/vars.props'

export type ElementBaseProps = Pick<ElementProps, 'if' | 'force' | 'log' | 'vars' | 'async' | 'loop' | 'title'>

export interface ElementProps {
  [key: string]: any
  /** |**  ->
    Expose item properties for others extends
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo:                     # Not run
          ->: helloTemplate
          skip: true
          content: Hello

      - echo:                     # => Hi
          <-: helloTemplate
          content: Hi
    ```
  */
  '->'?: string
  /** |**  <-
    Copy properties from others (a item, or list items)
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - http'get:
          skip: true
          ->: baseRequest
          baseURL: http://localhost
      - http'get:
          skip: true
          <-: baseRequest
          ->: user1Request
          headers:
            authorization: Bearer user1_token
      - http'get:
          skip: true
          ->: user2RequestWithoutBaseURL
          headers:
            authorization: Bearer user2_token

      - http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user1_token"
          <-: user1Request
          url: /posts
          vars: user1Posts

      - http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user2_token"
          <-:
            - baseRequest
            - user2RequestWithoutBaseURL
          url: /posts
          vars: user2Posts
    ```
  */
  '<-'?: string | string[]
  /** |**  skip
    Only init but not execute
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo:                     # Not run
          ->: helloTemplate
          skip: true
          content: Hello

      - echo:                      # => Hi
          <-: helloTemplate
          content: Hi
    ```
  */
  skip?: boolean
  /** |**  force
    Try to execute and ignore error in the running
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo:                     # Not run
          force: true
          content: Got error "abc is not defined" but it should not stop here ${abc}

      - echo: Keep playing
    ```
  */
  force?: boolean | string
  /** |**  title
    Title
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - sleep:
          title: Sleep in 1s
          duration: 1000
    ```
  */
  title?: string
  /** |**  log
    How to print log details for each of item.
    Default is `info`
    Value must be:
      - `all`: Print all of log message
      - `trace`: Print all of log message
      - `debug`: Print short of log
      - `info`: Print title, not show log details
      - `warn`: Only show warning log
      - `error`: Only show error log
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - http'get:
          title: Get data from a API
          log: debug
          url: http://...../data.json
    ```
  */
  log?: 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent'
  /** |**  vars
    Set value in the item to global vars to reused later
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - echo:
          content: Hello world
          vars: helloText
      - echo: ${vars.helloTexxt}
      # =>
      # Hello world
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
      - echo:
          loop: ${vars.arrs}
          content: Index is ${this.loopKey}, value is ${this.loopValue}
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
      - echo:
          loop: ${vars.obj}
          content: Key is ${this.loopKey}, value is ${this.loopValue}
      # =>
      # Key is name, value is thanh
      # Key is sex, value is male
    ```

    Dynamic loop in a condition
    ```yaml
      - vars:
          i: 0
      - echo:
          loop: ${vars.i < 3}
          content: value is ${vars.i++}
      # =>
      # value is 0
      # value is 1
      # value is 2
    ```

    Loop in nested items
    ```yaml
      - vars:
          arrs: [1,2,3]
      - group:
          loop: ${vars.arrs}
          title: group ${this.loopValue}
          items:
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
      - echo:                               # => Value is greater than 10
          if: ${vars.number > 10}
          content: Value is greater than 10
      - echo:                               # No print
          if: ${vars.number < 10}
          content: Value is lessthan than 10
    ```
  */
  if?: boolean | string
  /** |**  async
    Execute parallel tasks
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - http'get:
          async: true
          url: /categories
          vars: categories
      - http'get:
          async: true
          url: /product/1
          vars: product

      - echo: The product ${product.name} is in the categories ${categories.map(c => c.name)}
    ```
  */
  async?: boolean | string
}
