import assert from 'assert'
import merge from 'lodash.merge'
import { FNQueueDelete } from './fn-queue-delete'

/** |**  fn-queue'add
  Add a job to an exsited queue
  @order 6
  @example
  ```yaml
    - fn-queue'add:
        name: My Queue 1                 # Queue name to add
        data:                            # Job data
          key1: value1
  ```
*/
export class FNQueueAdd extends FNQueueDelete {
  data?: any

  constructor(props: any) {
    super(props)
    merge(this, props)
  }

  async exec() {
    assert(this.name)

    const queue = this.getQueue()
    assert(queue !== undefined, `Queue "${this.name}" is not existed before add`)

    queue.push(this.data)
    return false
  }

  dispose() { }
}
