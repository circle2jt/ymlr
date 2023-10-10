import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'

export default class implements Element {
  readonly proxy!: ElementProxy<this>

  async exec() {
    const stopFunc = (this.proxy.parent as any).stop
    if (stopFunc && typeof stopFunc === 'function') {
      await stopFunc.call(this.proxy.parent)
    }
  }

  dispose() { }
}
