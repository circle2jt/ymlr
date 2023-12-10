import { DebounceManager } from 'src/managers/debounce-manager'
import { FNDebounceFlush } from './fn-debounce-flush'

/** |**  fn-debounce'cancel
  Cancel debounce function (#Ref: lodash.debounce)
  @order 6
  @example
  ```yaml
    - fn-debounce'cancel:
        name: Delay to do something               # Debounce name to cancel
    # OR
    - fn-debounce'cancel: Delay to do something   # Debounce name to cancel
    # OR
    - fn-debounce'cancel:
        - delay1
        - delay2
  ```
*/
export class FNDebounceCancel extends FNDebounceFlush {
  async exec() {
    this.name?.forEach(name => {
      DebounceManager.Instance.get(name)?.cancel()
    })
  }
}
