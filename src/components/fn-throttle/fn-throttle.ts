import assert from 'assert'
import { type DebouncedFunc, type ThrottleSettings } from 'lodash'
import throttle from 'lodash.throttle'
import { formatTextToMs } from 'src/libs/format'
import { ThrottleManager } from 'src/managers/throttle-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-throttle
  Throttle function (#Ref: lodash.throttle)
  - Without "wait" and "runs" then it's only touch with last agruments
  - Specific "wait" and "runs" then it's run with new agruments
  @order 6
  @example
  ```yaml
    - fn-throttle:
        name: Delay to do something
        wait: 1s            # The number of milliseconds to throttle invocations to.
        trailing: true      # Specify invoking on the trailing edge of the timeout. Default is true
        leading: true       # Specify invoking on the leading edge of the timeout. Default is true
        autoRemove: true    # Auto remove it when reached the event. Default is false
        throttleData:       # Pass input debounceData to debounce to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - name: Do this ASAP and do again when it's called more than 1 times
          echo: ${ $ps.throttleData.dataFromParentState }

    # Call if throttle is existed
    - fn-throttle:                         # Touch the existed throttle with last agruments
        name: Delay to do something
    # OR
    - fn-throttle: Delay to do something   # Touch the existed throttle with last agruments
  ```
*/
export class FNThrottle implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>
  get logger() {
    return this.proxy.logger
  }

  name!: string
  wait?: number
  leading = true
  trailing = true
  throttleData: any

  autoRemove?: true | string | number
  #tmAutoRemove?: NodeJS.Timeout
  #fn?: DebouncedFunc<any>

  constructor(props: any) {
    if (typeof props === 'string') {
      props = {
        name: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    assert(this.name)

    if (ThrottleManager.Instance.has(this.name)) {
      this.logger.trace('%s: reused', this.name)
      // ThrottleManager.Instance.touch(this.name)
      ThrottleManager.Instance.touch(this.name)
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

        const opts: ThrottleSettings = {
          trailing: this.trailing,
          leading: this.leading
        }
        if (typeof this.wait === 'string') {
          this.wait = formatTextToMs(this.wait)
        }
        this.#fn = throttle(async (throttleData: any) => {
          await this.innerRunsProxy.exec({
            throttleData
          })
        }, this.wait, opts)
        ThrottleManager.Instance.set(this.name, this)
      }
      this.touch(this.throttleData)
    }
  }

  touch(throttleData?: any) {
    this.logger.trace('%s: touch', this.name)
    this.#scheduleAutoRemove(false)
    this.#fn?.(throttleData)
  }

  cancel() {
    this.logger.trace('%s: cancel', this.name)
    this.#scheduleAutoRemove(true)
    this.#fn?.cancel()
  }

  flush() {
    this.logger.trace('%s: flush', this.name)
    this.#fn?.flush()
    this.#scheduleAutoRemove(true)
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
        ThrottleManager.Instance.delete(this.name)
      }, this.autoRemove as number)
    }
  }
}
