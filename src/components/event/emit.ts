import assert from 'assert'
import { GlobalEvent } from 'src/libs/global-event'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

/** |**  event'emit
  Send data via global event
  @order 6
  @group event
  @example
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
export class EventEmiter implements Element {
  readonly proxy!: ElementProxy<this>

  name!: string
  data?: any
  opts?: any

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec() {
    assert(this.name)

    const opts = Array.isArray(this.opts) ? this.opts : (this.opts ? [this.opts] : [])
    this.proxy.logger.trace('Emited to event "%s": %j', this.name, this.data)
    GlobalEvent.emit(this.name, this.data, ...opts)
  }

  dispose() { }
}
