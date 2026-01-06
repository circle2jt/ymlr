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

    - fn-queue'del: My Queue 1           # Queue name to delete

    - fn-queue'del:
        - My Queue 1                    # List Queues name to delete
        - My Queue 2
  ```
*/
export class FNQueueDelete implements Element {
  readonly proxy!: ElementProxy<this>
  get logger() {
    return this.proxy.logger
  }

  name!: string[]

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
    assert(this.name?.length, 'name is required')

    const rs = await Promise.all(this.name.map(async name => {
      const queue = FNQueue.Caches.get(name)
      if (queue) {
        await queue.remove()
        return true
      }
      return false
    }))
    return rs.filter(isRemoved => isRemoved).length
  }

  // eslint-disable-next-line
  dispose() { }

}
