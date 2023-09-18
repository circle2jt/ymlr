import assert from 'assert'
import axios from 'axios'
import chalk from 'chalk'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'
import { type PubProps } from './pub.props'

/** |**  http/jobs'add
  Add a job to the queue
  @example
  Add a job by default
  ```yaml
    - http/jobs'add:
        address: 0.0.0.0:3007         # Address to listen to add a new job to queue
        data:                         # Steps to do a job
          name: name1
          age: 2
  ```

  Use a "GET" http request to add a job
  ```yaml
    - http'get:
        url: http://0.0.0.0:3007?name=name1&age=2
  ```

  Use a "POST" http request to add a job
  ```yaml
    - http'post:
        url: http://0.0.0.0:3007?name=name1
        body:
          age: 2
  ```
*/
export class Pub implements Element {
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  address?: string
  data: any

  secure?: {
    basic?: string
  } | string

  constructor(props: PubProps) {
    Object.assign(this, props)
  }

  async exec() {
    try {
      assert(this.address)
      const address = this.address.startsWith('http://') ? this.address : `http://${this.address}`
      this.logger.debug('Add a job').trace('%j', this.data)
      const headers: any = { 'content-type': 'application/json' }
      if (this.secure) {
        if (typeof this.secure === 'string') {
          headers.authorization = this.secure
        } else if (this.secure.basic) {
          headers.authorization = `Basic ${this.secure.basic}`
        }
      }
      const rs = await axios.post(address.toString(), this.data, {
        headers
      })
      return rs
    } catch (err: any) {
      this.logger.warn(`Could not add a job to queue "${this.address}" \t %s`, chalk.gray(err?.message))
    }
  }

  dispose() { }
}
