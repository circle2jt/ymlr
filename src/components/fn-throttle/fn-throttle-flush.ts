import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNThrottle } from './fn-throttle'

/** |**  fn-throttle'flush
  Force to call throttle function ASAP if it's called before that (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'flush:
        name: Delay to do something                 # Throttle name to delete
    # OR
    - fn-throttle'flush: Delay to do something      # Throttle name to delete
  ```
*/
export class FNThrottleFlush implements Element {
  readonly proxy!: ElementProxy<this>

  name!: string

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

    const fn = FNThrottle.Caches.get(this.name)
    fn?.flush()
    return fn
  }

  dispose() { }
}
