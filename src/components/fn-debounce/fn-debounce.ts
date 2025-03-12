import assert from 'assert'
import { type DebouncedFunc, type DebounceSettings } from 'lodash'
import debounce from 'lodash.debounce'
import { formatTextToMs } from 'src/libs/format'
import { DebounceManager } from 'src/managers/debounce-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
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
        autoRemove: true        # Auto remove it when reached the event. Default is false.
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
  get logger() {
    return this.proxy.logger
  }

  name!: string
  wait?: number | string
  maxWait?: number | string
  trailing = true
  leading = false
  autoRemove?: true | string | number
  #tmAutoRemove?: NodeJS.Timeout
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
      this.logger.trace('%s: reused', this.name)
      // DebounceManager.Instance.touch(this.name)
      DebounceManager.Instance.touch(this.name, parentState)
    } else if (this.proxy.runs?.length) {
      if (!this.#fn) {
        this.logger.trace('%s: create a new one', this.name)

        this.wait ?? assert.fail('wait is required')
        let wait = 0
        let autoRemove: number | undefined
        if (typeof this.wait === 'string') {
          wait = formatTextToMs(this.wait)
        } else if (typeof this.wait === 'number') {
          wait = this.wait
        }
        this.wait = wait

        if (this.autoRemove === true) {
          autoRemove = wait
        } else if (typeof this.autoRemove === 'string') {
          autoRemove = formatTextToMs(this.autoRemove)
        } else if (typeof this.autoRemove === 'number') {
          autoRemove = this.autoRemove
        }
        if (autoRemove !== undefined) {
          if (autoRemove <= wait) {
            autoRemove = wait + 500
          }
          this.autoRemove = autoRemove
        }

        const opts: DebounceSettings = {
          trailing: this.trailing,
          leading: this.leading
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
      this.touch(parentState)
    }
  }

  touch(parentState?: Record<string, any>) {
    this.logger.trace('%s: touch', this.name)
    if (parentState !== undefined) {
      this.#parentState = parentState
    }
    this.#scheduleAutoRemove(false)
    this.#fn?.(this.#parentState)
  }

  cancel() {
    this.logger.trace('%s: cancel', this.name)
    this.#scheduleAutoRemove(true)
    this.#fn?.cancel()
  }

  flush() {
    this.logger.trace('%s: flush', this.name)
    this.#fn?.flush()
  }

  dispose() {
    this.logger.trace('%s: dispose', this.name)
  }

  #scheduleAutoRemove(stop: boolean) {
    if (!this.autoRemove) return
    this.logger.trace(`%s: auto remove after ${this.autoRemove}ms`, this.name)
    if (this.#tmAutoRemove) clearTimeout(this.#tmAutoRemove)
    if (stop) {
      this.#tmAutoRemove = undefined
    } else {
      this.#tmAutoRemove = setTimeout(() => {
        this.#tmAutoRemove = undefined
        DebounceManager.Instance.delete(this.name)
      }, this.autoRemove as number)
    }
  }
}
