import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { INNERRUN_PROXY_PARENT } from '../group/group'

export default class implements Element {
  readonly proxy!: ElementProxy<this>

  async exec() {
    let parentProxy = this.proxy.parentProxy
    while (parentProxy?.tag === INNERRUN_PROXY_PARENT.description) {
      parentProxy = parentProxy?.parentProxy
    }
    await parentProxy?.dispose()
  }

  dispose() { }
}
