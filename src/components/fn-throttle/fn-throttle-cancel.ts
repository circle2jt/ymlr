import { ThrottleManager } from 'src/managers/throttle-manager'
import { FNThrottleFlush } from './fn-throttle-flush'

/** |**  fn-throttle'cancel
  Cancel throttle function (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'cancel:
        name: Delay to do something               # Throttle name to cancel
    # OR
    - fn-throttle'cancel: Delay to do something   # Throttle name to cancel
    # OR
    - fn-throttle'cancel:
        - delay1
        - delay2
  ```
*/
export class FNThrottleCancel extends FNThrottleFlush {
  override exec() {
    this.name?.forEach(name => { ThrottleManager.Instance.cancel(name) })
  }
}
