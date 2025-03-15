import assert from 'assert'
import { GlobalEvent } from 'src/libs/global-event'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  event'on
  Handle global events in app
  @order 6
  @group event
  @example
  ```yaml
    - name: listen to handle an events
      event'on:
        name: test-event
      runs:
        - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
        - echo: ${ $parentState.eventOpts }   # => [ params 1, params 2 ]

    - name: listen to handle multiple events
      event'on:
        names:
          - test-event1
          - test-event2
          - test-event3
      runs:
        - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
        - echo: ${ $parentState.eventOpts }   # => [ params 1, params 2 ]
  ```
  ```yaml
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
export class EventOn implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  names!: string[]

  #handlers!: any[]
  #resolve?: (_: any) => void
  #reject?: (err: Error) => void

  constructor({ name, names = [], ...props }: any) {
    if (name) names.push(name)
    Object.assign(this, { names, ...props })
  }

  async exec(parentState?: any) {
    assert(this.names?.length)

    this.#handlers = new Array(this.names.length)
    this.names.forEach((name, i) => {
      this.proxy.logger.trace('Listening event %s', name)

      this.#handlers[i] = async (...args: any[]) => {
        this.proxy.logger.trace('<-[%s]: %j', name, ...args)
        const [data, ...opts] = args
        try {
          await this.innerRunsProxy.exec({
            eventData: data,
            eventOpt: opts[0],
            eventOpts: opts
          })
        } catch (err: any) {
          this.#reject?.(err as Error)
        }
      }
      GlobalEvent.on(name, this.#handlers[i])
    })

    await new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
  }

  dispose() {
    if (this.#resolve) {
      this.names.forEach((name, i) => {
        this.proxy.logger.trace('Off %s', name)
        GlobalEvent.off(name, this.#handlers[i])
      })
      this.#resolve(undefined)
      this.#resolve = undefined
      this.#reject = undefined
    }
  }
}
