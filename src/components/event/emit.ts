import assert from 'assert'
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

    - name: quick to emit multiple event with eventData is empty
      event'emit: [test-event1, test-event2]

    - name: quick to emit an event with eventData is empty
      event'emit: test-event1
  ```
*/
export class EventEmiter implements Element {
  readonly proxy!: ElementProxy<this>

  names!: string[]
  data?: any
  opts?: any

  constructor(rawProps: any) {
    if (typeof rawProps === 'string') {
      globalThis.copyProps(this, { names: [rawProps] })
      return
    }
    if (Array.isArray(rawProps)) {
      globalThis.copyProps(this, { names: rawProps })
      return
    }
    const { name, names = [], ...props } = rawProps
    if (name) names.push(name)
    globalThis.copyProps(this, { names, ...props })
  }

  async exec() {
    assert(this.names?.length, 'name or names is required')

    const opts = Array.isArray(this.opts) ? this.opts : (this.opts ? [this.opts] : [])
    this.names.forEach(name => {
      this.proxy.logger.trace('Emited to event "%s": %j', name, this.data)
      this.proxy.globalEvent.emit(name, this.data, ...opts)
    })
  }

  dispose() { }
}
