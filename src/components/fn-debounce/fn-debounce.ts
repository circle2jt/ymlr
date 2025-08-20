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
        debounceData:           # Pass input debounceData to debounce to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - name: Do this when it's free for 1s
          echo: ${ $ps.debounceData.dataFromParentState }

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
  debounceData: any

  private scheduleAutoRemove: any
  private fn?: DebouncedFunc<any>
  private promsise?: {
    t: Promise<any>
    resolve: (value?: any) => void
    reject: (reason?: any) => void
  }

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

    if (DebounceManager.Instance.has(this.name)) {
      this.logger.trace('%s: reused', this.name)
      // DebounceManager.Instance.touch(this.name)
      DebounceManager.Instance.touch(this.name, this.debounceData)
      return
    }
    assert(this.proxy.runs?.length)

    this.logger.trace('%s: create a new one', this.name)

    const promsise = {
      t: undefined,
      resolve: (_value?: any) => { },
      reject: (_reason?: any) => { }
    }
    const t = new Promise<any>((resolve, reject) => {
      promsise.resolve = resolve
      promsise.reject = reject
    })
    promsise.t = t as any
    this.promsise = promsise as any

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
    const waitTime = (this.maxWait || this.wait) as number
    if (this.autoRemove && waitTime) {
      this.scheduleAutoRemove = debounce(() => {
        this.logger.trace('%s: schedule auto remove after', this.name)
        this.remove()
      }, waitTime + 500, { leading: false, trailing: true })
    }
    this.fn = debounce(async (debounceData: any) => {
      this.scheduleAutoRemove?.()
      try {
        await this.innerRunsProxy.exec({
          debounceData
        })
      } catch (err) {
        this.promsise?.reject(err)
      }
    }, this.wait, opts)
    DebounceManager.Instance.set(this.name, this)
    this.touch(this.debounceData)
    await this.promsise?.t
  }

  touch(debounceData?: any) {
    if (!this.fn) return
    this.logger.trace('%s: touch', this.name)
    this.fn?.(debounceData)
  }

  cancel() {
    if (!this.fn) return
    this.logger.trace('%s: cancel', this.name)
    this.fn?.cancel()
    this.scheduleAutoRemove?.cancel()
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
    this.debounceData = undefined
    this.promsise?.resolve()
  }

  async dispose() {
    if (!this.fn) return
    this.logger.trace('%s: dispose', this.name)
    this.remove()
    await this.innerRunsProxy.dispose()
    this.promsise = undefined
    this.fn = undefined
  }
}
