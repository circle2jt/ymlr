import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNDebounce } from './fn-debounce'

/** |**  fn-debounce'cancel
  Cancel debounce function (#Ref: lodash.debounce)
  @order 6
  @example
  ```yaml
    - fn-debounce'cancel:
        name: Delay to do something               # Debounce name to cancel
    # OR
    - fn-debounce'cancel: Delay to do something   # Debounce name to cancel
  ```
*/
export class FNDebounceCancel implements Element {
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

    const fn = FNDebounce.Caches.get(this.name)
    fn?.cancel()
    return fn
  }

  dispose() { }
}
