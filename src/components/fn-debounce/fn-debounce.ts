import assert from 'assert'
import ENVGlobal from 'src/env-global'
import { debounce, type DebouncedFunc, type DebounceSettings } from 'src/libs/debounce'
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
        skipError: false        # Ignore error in the running
        debounceData:           # Pass input debounceData to debounce to do async task
          dataFromParentState: ${ $ws().channelData.name }
      runs:
        - name: Do this when it's free for 1s
          echo: ${ $ws().debounceData.dataFromParentState }

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

  overrideProxyProps() {
    return {
      detach: true
    }
  }

  name!: string
  wait?: number | string
  maxWait?: number | string
  trailing = true
  leading = false
  autoRemove?: true | string | number
  debounceData?: any
  skipError = ENVGlobal.FN_DEBOUNCE_SKIP_ERROR

  private fn?: DebouncedFunc

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

    if (DebounceManager.Instance.has(this.name)) {
      this.logger.trace('%s: reused', this.name)
      DebounceManager.Instance.touch(this.name, this.debounceData)
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

    const opts: DebounceSettings = {
      trailing: this.trailing,
      leading: this.leading
    }
    if (this.maxWait && typeof this.maxWait === 'string') {
      this.maxWait = formatTextToMs(this.maxWait)
      opts.maxWait = this.maxWait
    }
    this.fn = debounce(async (debounceData: any) => {
      try {
        await this.innerRunsProxy.exec({
          debounceData
        })
      } catch (err) {
        if (!this.skipError) throw err
        this.logger.warn(err)
      }
    }, this.wait, { ...opts, autoDispose: this.autoRemove as boolean })
    if (this.autoRemove) {
      this.fn.onDone = () => {
        this.logger.trace('%s: schedule auto remove after', this.name)
        this.remove()
      }
    }
    DebounceManager.Instance.set(this.name, this)
    this.touch(this.debounceData)
    await this.fn?.waitToDispose()
  }

  touch(debounceData = this.debounceData) {
    if (!this.fn) return
    this.logger.trace('%s: touch', this.name)
    this.fn?.(debounceData)
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
    DebounceManager.Instance.delete(this.name)
    this.cancel()
    this.fn.dispose()
  }

  async dispose() {
    this.logger.trace('%s: dispose', this.name)
    this.remove()
    await this.innerRunsProxy.dispose()
  }
}
