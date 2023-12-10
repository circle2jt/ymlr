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
    # OR
    - fn-throttle'del:
        - delay1
        - delay2
  ```
*/
export class FNThrottleDelete extends FNThrottleCancel {
  override dispose() {
    this.name?.forEach(name => {
      FNThrottle.Caches.delete(name)
    })
  }
}
