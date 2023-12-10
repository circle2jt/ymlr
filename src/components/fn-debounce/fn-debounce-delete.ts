import { DebounceManager } from 'src/managers/debounce-manager'
import { FNDebounceCancel } from './fn-debounce-cancel'

/** |**  fn-debounce'del
  Cancel & remove debounce function (#Ref: lodash.debounce)
  @order 6
  @example
  ```yaml
    - fn-debounce'del:
        name: Delay to do something               # Debounce name to delete
    # OR
    - fn-debounce'del: Delay to do something      # Debounce name to delete
    # OR
    - fn-debounce'del:
        - delay1
        - delay2
  ```
*/
export class FNDebounceDelete extends FNDebounceCancel {
  override exec() {
    this.name?.forEach(name => DebounceManager.Instance.delete(name))
  }
}
