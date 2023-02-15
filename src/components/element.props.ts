import { LoggerLevel } from 'src/libs/logger'
import { VarsProps } from './vars/vars.props'

export const ElementBaseKeys = ['->', '<-', 'template', 'if', 'force', 'debug', 'vars', 'async', 'loop', 'name', 'skip']
export type ElementBaseProps = Pick<ElementProps, 'if' | 'force' | 'debug' | 'vars' | 'async' | 'loop' | 'name' | 'skip'>

export interface ElementProps {
  [key: string]: any
  /** |**  ->
    Expose item properties for others extends
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - ->: helloTemplate
        skip: true
        echo: Hello               # Not run

      - <-: helloTemplate
        echo: Hi                  # => Hi
    ```
  */
  '->'?: string
  /** |**  <-
    Copy properties from others (a item, or list items)
    @position top
    @tag It's a property in a tag
    @example
    ```yaml
      - skip: true
        ->: baseRequest
        http'get:
          baseURL: http://localhost
      - skip: true
        <-: baseRequest
        ->: user1Request
        http'get:
          headers:
            authorization: Bearer user1_token
      - skip: true
        ->: user2RequestWithoutBaseURL
        http'get:
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
      - echo: ${vars.helloText}     # => Hello world
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
      - loop: ${vars.arrs}
        echo: Index is ${this.loopKey}, value is ${this.loopValue}
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
      - loop: ${vars.obj}
        echo: Key is ${this.loopKey}, value is ${this.loopValue}
      # =>
      # Key is name, value is thanh
      # Key is sex, value is male
    ```

    Dynamic loop in a condition
    ```yaml
      - vars:
          i: 0
      - loop: ${vars.i < 3}
        echo: value is ${vars.i++}
      # =>
      # value is 0
      # value is 1
      # value is 2
    ```

    Loop in nested items
    ```yaml
      - vars:
          arrs: [1,2,3]
      - loop: ${vars.arrs}
        name: group ${this.loopValue}
        group:
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
      - if: ${vars.number > 10}
        echo: Value is greater than 10      # => Value is greater than 10

      - if: ${vars.number < 10}
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

      - name: The product ${product.name} is in the categories ${categories.map(c => c.name)}
    ```
  */
  async?: boolean | string
}
