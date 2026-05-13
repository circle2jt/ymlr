import assert from 'assert'
import { formatTextToMs } from 'src/libs/format'
import { throttle, type ThrottledFunc, type ThrottleSettings } from 'src/libs/throttle'
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

  overrideProxyProps() {
    return {
      detach: true
    }
  }

  name!: string
  wait?: number
  leading = true
  trailing = true
  autoRemove?: true | string | number
  throttleData?: any

  private fn?: ThrottledFunc
  constructor(props: any) {
    if (typeof props === 'string') {
      props = {
        name: props
      }
    }
    globalThis.copyProps(this, props)
  }

  async exec() {
    assert(this.name?.length, 'name is required')

    if (ThrottleManager.Instance.has(this.name)) {
      this.logger.trace('%s: reused', this.name)
      ThrottleManager.Instance.touch(this.name, this.throttleData)
      return
    }
    assert(this.proxy.runs, 'runs is required')

    this.logger.trace('%s: create a new one', this.name)

    this.wait ?? assert.fail('wait is required')
    let wait = 0
    if (typeof this.wait === 'string') {
      wait = formatTextToMs(this.wait)
    } else if (typeof this.wait === 'number') {
      wait = this.wait
    }
    this.wait = wait

    const opts: ThrottleSettings = {
      trailing: this.trailing,
      leading: this.leading
    }
    this.fn = throttle(async (throttleData: any) => {
      this.logger.trace('%s: run', this.name)
      await this.innerRunsProxy.exec({
        throttleData
      })
    }, this.wait, { ...opts, autoDispose: this.autoRemove as boolean })
    if (this.autoRemove) {
      this.fn.onDone = () => {
        this.logger.trace('%s: schedule auto remove after', this.name)
        this.remove()
      }
    }
    ThrottleManager.Instance.set(this.name, this)
    this.touch(this.throttleData)
    await this.fn?.waitToDispose()
  }

  touch(throttleData = this.throttleData) {
    if (!this.fn) return
    this.logger.trace('%s: touch', this.name)
    this.fn?.(throttleData)
  }

  cancel() {
    if (!this.fn) return
    this.logger.trace('%s: cancel', this.name)
    this.fn?.cancel()
  }

  flush() {
    if (!this.fn) return
    this.logger.trace('%s: flush', this.name)
    this.fn?.flush()
  }

  remove() {
    if (!this.fn) return
    this.logger.trace('%s: remove', this.name)
    ThrottleManager.Instance.delete(this.name)
    this.cancel()
    this.fn.dispose()
  }

  async dispose() {
    this.logger.trace('%s: dispose', this.name)
    this.remove()
    await this.innerRunsProxy.dispose()
  }
}
