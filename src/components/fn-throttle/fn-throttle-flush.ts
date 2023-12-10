import { ThrottleManager } from 'src/managers/throttle-manager'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

/** |**  fn-throttle'flush
  Force to call throttle function ASAP if it's called before that (#Ref: lodash.throttle)
  @order 6
  @example
  ```yaml
    - fn-throttle'flush:
        name: Delay to do something                 # Throttle name to delete
    # OR
    - fn-throttle'flush: Delay to do something      # Throttle name to delete
    # OR
    - fn-throttle'flush:
        - delay1
        - delay2
  ```
*/
export class FNThrottleFlush implements Element {
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

  exec() {
    this.name?.forEach(name => { ThrottleManager.Instance.flush(name) })
  }

  dispose() { }
}
