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
    # OR
    - fn-debounce'flush:
        - delay1
        - delay2
  ```
*/
export class FNDebounceFlush implements Element {
  readonly proxy!: ElementProxy<this>

  name?: string[]

  constructor(props: any) {
    if (typeof props === 'string' || Array.isArray(props)) {
      props = {
        name: props
      }
    }
    Object.assign(this, props)
    if (this.name && !Array.isArray(this.name)) {
      this.name = [this.name]
    }
  }

  async exec() {
    this.name?.forEach(name => {
      FNDebounce.Caches.get(name)?.flush()
    })
  }

  dispose() { }
}
