import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type BaseProps } from './base.props'

export default class Base implements Element {
  readonly proxy!: ElementProxy<this>

  constructor(public readonly props?: BaseProps) { }

  async exec() {
    return this.props
  }

  dispose() { }
}
