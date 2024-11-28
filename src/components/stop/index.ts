import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

export default class Stop implements Element {
  readonly proxy!: ElementProxy<this>

  async exec() {
    if (this.proxy.parentProxy) {
      this.proxy.parentProxy._forceStop = true
    }
  }

  async dispose() {
    await this.proxy.parentProxy?.dispose()
  }
}
