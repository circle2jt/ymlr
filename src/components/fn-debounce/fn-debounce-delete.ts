import assert from 'assert'
import { FNDebounce } from './fn-debounce'
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
  ```
*/
export class FNDebounceDelete extends FNDebounceCancel {
  async exec() {
    assert(this.name)

    const fn = await super.exec()
    FNDebounce.Caches.delete(this.name)
    return fn
  }

  dispose() { }
}
