import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

export default class Base implements Element {
  readonly proxy!: ElementProxy<this>

  constructor(public readonly props?: any) { }

  async exec() {
    return this.props
  }

  dispose() { }
}
