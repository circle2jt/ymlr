import assert from 'assert'
import { GlobalEvent } from 'src/libs/global-event'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  event'on
  Handle global events in app
  @order 6
  @group event
  @example
  ```yaml
    - event'on:
        name: test-event
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

  name!: string

  #handler!: any
  #resolve?: (_: any) => void
  #reject?: (err: Error) => void

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec(parentState?: any) {
    assert(this.name)

    this.proxy.logger.trace('Listening event %s', this.name)
    this.#handler = async (...args: any[]) => {
      this.proxy.logger.trace('<-[%s]: %j', this.name, ...args)
      const [data, ...opts] = args
      try {
        await this.innerRunsProxy.exec({
          ...parentState,
          eventData: data,
          eventOpt: opts[0],
          eventOpts: opts
        })
      } catch (err: any) {
        this.#reject?.(err as Error)
      }
    }
    GlobalEvent.on(this.name, this.#handler)

    await new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
  }

  dispose() {
    if (this.#resolve) {
      this.proxy.logger.trace('Off %s', this.name)
      GlobalEvent.off(this.name, this.#handler)
      this.#resolve(undefined)
      this.#resolve = undefined
      this.#reject = undefined
    }
  }
}
