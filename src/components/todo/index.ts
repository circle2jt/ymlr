import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

export default class Todo implements Element {
  readonly proxy!: ElementProxy<this>
  readonly hideName = true

  constructor(public readonly name: string) {
  }

  async exec() {
    if (!this.name) return

    this.proxy.icon = '⃣'
    this.proxy.logger.warn(this.name)
  }

  dispose() { }
}
