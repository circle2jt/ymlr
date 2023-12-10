import assert from 'assert'
import debounce from 'lodash.debounce'
import { formatTextToMs } from 'src/libs/format'
import { DebounceManager } from 'src/managers/debounce-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-debounce
  Debounce function (#Ref: lodash.debounce)
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

    # Call if debounce is existed
    - fn-debounce:
        name: Delay to do something
    # OR
    - fn-debounce: Delay to do something
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

    if (typeof this.wait === 'string') {
      this.wait = formatTextToMs(this.wait)
    }
    if (this.maxWait && typeof this.maxWait === 'string') {
      this.maxWait = formatTextToMs(this.maxWait)
    }

    let fn = DebounceManager.Instance.get(this.name)
    if (!fn && this.wait !== undefined && this.proxy.runs?.length) {
      fn = debounce(async (parentState?: Record<string, any>) => {
        await this.innerRunsProxy.exec(parentState)
      }, this.wait, {
        trailing: this.trailing,
        leading: this.leading,
        maxWait: this.maxWait
      })
      DebounceManager.Instance.set(this.name, fn)
    }
    if (fn) {
      fn(parentState)
    }
  }

  cancel() {
    const fn = DebounceManager.Instance.get(this.name)
    if (fn) {
      fn.cancel()
      return true
    }
    return false
  }

  flush() {
    const fn = DebounceManager.Instance.get(this.name)
    if (fn) {
      fn.flush()
      return true
    }
    return false
  }

  remove() {
    if (this.cancel()) {
      DebounceManager.Instance.delete(this.name)
      return true
    }
    return false
  }

  dispose() { }
}
