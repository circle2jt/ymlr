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
    - name: send data to an event
      event'emit:
        name: test-event
        data:
          name: Test event
          data: Hello
        opts:
          - params 1
          - params 2

    - name: send data to multiple events
      event'emit:
        names:
          - test-event1
          - test-event2
          - test-event3
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

  names!: string[]
  data?: any
  opts?: any

  constructor({ name, names = [], ...props }: any) {
    if (name) names.push(name)
    Object.assign(this, { names, ...props })
  }

  async exec() {
    assert(this.names?.length)

    const opts = Array.isArray(this.opts) ? this.opts : (this.opts ? [this.opts] : [])
    this.names.forEach(name => {
      this.proxy.logger.trace('Emited to event "%s": %j', name, this.data)
      GlobalEvent.emit(name, this.data, ...opts)
    })
  }

  dispose() { }
}
