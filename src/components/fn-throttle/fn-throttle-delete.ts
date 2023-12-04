import assert from 'assert'
import { FNThrottle } from './fn-throttle'
import { FNThrottleCancel } from './fn-throttle-cancel'

/** |**  fn-throttle'del
  Cancel & remove throttle function (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'del:
        name: Delay to do something               # Throttle name to delete
    # OR
    - fn-throttle'del: Delay to do something      # Throttle name to delete
  ```
*/
export class FNThrottleDelete extends FNThrottleCancel {
  async exec() {
    assert(this.name)

    const fn = await super.exec()
    FNThrottle.Caches.delete(this.name)
    return fn
  }

  dispose() { }
}
