import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNDebounce } from './fn-debounce'

/** |**  fn-debounce'flush
  Force to call debounce function ASAP if it's called before that (#Ref: lodash.debounce)
  @order 6
  @example
  ```yaml
    - fn-debounce'flush:
        name: Delay to do something                 # Debounce name to delete
    # OR
    - fn-debounce'flush: Delay to do something      # Debounce name to delete
  ```
*/
export class FNDebounceFlush implements Element {
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
    fn?.flush()
    return fn
  }

  dispose() { }
}
