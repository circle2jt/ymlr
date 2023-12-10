import assert from 'assert'
import { type DebouncedFunc, type DebounceSettings } from 'lodash'
import debounce from 'lodash.debounce'
import { formatTextToMs } from 'src/libs/format'
import { DebounceManager } from 'src/managers/debounce-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-debounce
  Debounce function (#Ref: lodash.debounce)
  - Without "wait" and "runs" then it's only touch with last agruments
  - Specific "wait" and "runs" then it's run with new agruments
  @order 6
  @example
  ```yaml
    - fn-debounce:
        name: Delay to do something
        wait: 1s                # The number of milliseconds to delay.
        trailing: true          # Specify invoking on the trailing edge of the timeout. Default is true
        leading: false          # Specify invoking on the leading edge of the timeout. Default is false
        maxWait: 2s             # The maximum time func is allowed to be delayed before it's invoked.
      runs:
        - echo: Do this when it's free for 1s

    # touch if debounce is existed
    - fn-debounce:                          # Touch the existed throttle with last agruments
        name: Delay to do something
    # OR
    - fn-debounce: Delay to do something    # Touch the existed throttle with last agruments
  ```
*/
export class FNDebounce implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  name!: string
  wait?: number
  maxWait?: number
  trailing = true
  leading = false
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

    if (DebounceManager.Instance.has(this.name)) {
      this.#parentState = parentState
      DebounceManager.Instance.touch(this.name)
    } else if (this.wait !== undefined && this.proxy.runs?.length) {
      if (!this.#fn) {
        const opts: DebounceSettings = {
          trailing: this.trailing,
          leading: this.leading
        }
        if (typeof this.wait === 'string') {
          this.wait = formatTextToMs(this.wait)
        }
        if (this.maxWait && typeof this.maxWait === 'string') {
          this.maxWait = formatTextToMs(this.maxWait)
          opts.maxWait = this.maxWait
        }
        this.#fn = debounce(async (parentState?: Record<string, any>) => {
          await this.innerRunsProxy.exec(parentState)
        }, this.wait, opts)
        DebounceManager.Instance.set(this.name, this)
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
