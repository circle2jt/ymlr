import assert from 'assert'
import { type DebouncedFunc } from 'lodash'
import throttle from 'lodash.throttle'
import { formatTextToMs } from 'src/libs/format'
import { ThrottleManager } from 'src/managers/throttle-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-throttle
  Throttle function (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle:
        name: Delay to do something
        wait: 1s            # The number of milliseconds to throttle invocations to.
        trailing: true      # Specify invoking on the trailing edge of the timeout. Default is true
        leading: true      # Specify invoking on the leading edge of the timeout. Default is true
      runs:
        - echo: Do this when it's free for 1s

    # Call if throttle is existed
    - fn-throttle:
        name: Delay to do something
    # OR
    - fn-throttle: Delay to do something
  ```
*/
export class FNThrottle implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  name!: string
  wait?: number
  leading = true
  trailing = true
  #fn?: DebouncedFunc<any>
  #parentState?: Record<string, any>

  constructor(props: any) {
    if (typeof props === 'string') {
      props = {
        name: props
      }
    }
    Object.assign(this, props)
  }

  async exec(parentState?: Record<string, any>) {
    assert(this.name)

    if (ThrottleManager.Instance.has(this.name)) {
      ThrottleManager.Instance.touch(this.name)
    } else if (this.wait !== undefined && this.proxy.runs?.length) {
      if (!this.#fn) {
        if (typeof this.wait === 'string') {
          this.wait = formatTextToMs(this.wait)
        }
        this.#fn = throttle(async (parentState?: Record<string, any>) => {
          await this.innerRunsProxy.exec(parentState)
        }, this.wait, {
          trailing: this.trailing,
          leading: this.leading
        })
        ThrottleManager.Instance.set(this.name, this)
      }
      this.#parentState = parentState
      this.touch()
    }
  }

  touch() {
    this.#fn?.(this.#parentState)
  }

  cancel() {
    this.#fn?.cancel()
  }

  flush() {
    this.#fn?.flush()
  }

  dispose() { }
}
