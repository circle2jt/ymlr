import chalk from 'chalk'
import { H_SPACE, H_SPACE_0, V_SPACE, V_SPACE_0 } from './console'

export class Indent {
  indentString = ''

  #indent = 0

  set indent(indent: number) {
    this.#indent = indent
    this.indentString = chalk.gray.dim(new Array(indent)
      .fill(`${V_SPACE_0}${H_SPACE_0}`)
      .map((vl, i) => {
        if (i === indent - 1) {
          return vl.replace(V_SPACE_0, V_SPACE).replace(H_SPACE_0, H_SPACE)
        }
        return vl
      })
      .join(''))
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
