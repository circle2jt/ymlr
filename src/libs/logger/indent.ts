import { H_SPACE, V_SPACE } from './console'

export class Indent {
  indentString = ''

  #indent = 0

  set indent(indent: number) {
    this.#indent = indent
    this.indentString = new Array(indent).fill(`${V_SPACE}${H_SPACE}`).join('')
  }

  get indent() {
    return this.#indent
  }

  constructor(indent = 0) {
    this.update(indent)
  }

  add(indent = 1) {
    this.update(this.indent + indent)
  }

  update(indent: number) {
    this.indent = indent
  }

  clone() {
    return new Indent(this.indent)
  }
}
