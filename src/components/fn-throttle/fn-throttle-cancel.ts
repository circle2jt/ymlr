import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNThrottle } from './fn-throttle'

/** |**  fn-throttle'cancel
  Cancel throttle function (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'cancel:
        name: Delay to do something               # Throttle name to cancel
    # OR
    - fn-throttle'cancel: Delay to do something   # Throttle name to cancel
  ```
*/
export class FNThrottleCancel implements Element {
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
    fn?.cancel()
    return fn
  }

  dispose() { }
}
