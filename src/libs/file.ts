import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'

export class File {
  constructor(private readonly path: string, proxy: ElementProxy<Element>) {
    this.path = proxy.getPath(path || '')
  }

  toString() {
    return `file://${this.path}`
  }

  toJSON() {
    return this.toString()
  }
}
