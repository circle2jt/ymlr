import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { FNQueue } from './fn-queue'

/** |**  fn-queue'del
  Stop and remove a queue
  @order 6
  @example
  ```yaml
    - fn-queue'del:
        name: My Queue 1                 # Queue name to delete
    # OR
    - fn-queue'del: My Queue 1           # Queue name to delete
  ```
*/
export class FNQueueDelete implements Element {
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

    const queue = this.getQueue()
    if (queue) {
      await queue.remove()
      await queue.dispose()
      return true
    }
    return false
  }

  dispose() { }

  protected getQueue() {
    return FNQueue.Caches.get(this.name)
  }
}
