import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

export default class implements Element {
  readonly proxy!: ElementProxy<this>

  async exec() {
    await this.proxy.parent?.dispose()
  }

  dispose() { }
}
