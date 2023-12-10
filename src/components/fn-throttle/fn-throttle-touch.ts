import { ThrottleManager } from 'src/managers/throttle-manager'
import { FNThrottleFlush } from './fn-throttle-flush'

/** |**  fn-throttle'touch
  touch throttle function. Reused last agruments (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'touch:
        name: Delay to do something               # Throttle name to touch
    # OR
    - fn-throttle'touch: Delay to do something   # Throttle name to touch
    # OR
    - fn-throttle'touch:
        - delay1
        - delay2
  ```
*/
export class FNThrottleTouch extends FNThrottleFlush {
  override exec() {
    this.name?.forEach(name => { ThrottleManager.Instance.touch(name) })
  }
}
