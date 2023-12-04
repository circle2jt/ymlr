import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNSingleton } from './fn-singleton'

/** |**  fn-singleton'del
  Remove singleton function
  @order 6
  @example
  ```yaml
    - fn-singleton'del:
        name: Delay to do something                 # Singleton name to delete
    # OR
    - fn-singleton'del: Delay to do something       # Singleton name to delete
  ```
*/
export class FNSingletonDelete implements Element {
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

    return FNSingleton.Caches.delete(this.name)
  }

  dispose() { }
}
