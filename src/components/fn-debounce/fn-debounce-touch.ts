import { DebounceManager } from 'src/managers/debounce-manager'
import { FNDebounceFlush } from './fn-debounce-flush'

/** |**  fn-debounce'touch
  touch debounce function. Reused last agruments(#Ref: lodash.debounce)
  @order 6
  @example
  ```yaml
    - fn-debounce'touch:
        name: Delay to do something               # Debounce name to touch
    # OR
    - fn-debounce'touch: Delay to do something    # Debounce name to touch
    # OR
    - fn-debounce'touch:
        - delay1
        - delay2
  ```
*/
export class FNDebouncetouch extends FNDebounceFlush {
  override exec() {
    this.name?.forEach(name => { DebounceManager.Instance.touch(name) })
  }
}
