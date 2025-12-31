import chalk from 'chalk'
import { H_SPACE, H_SPACE_0, V_SPACE_0 } from './console'

const disableLogIndent = process.env.DISABLE_LOG_INDENT === '1'

export class Indent {
  indentString = ''

  private _indent = 0
  set indent(indent: number) {
    if (disableLogIndent) return
    this._indent = indent
    this.indentString = chalk.gray.dim(new Array(indent)
      .fill(`${V_SPACE_0}${H_SPACE_0}`)
      .map((vl, i) => {
        if (i === indent - 1) {
          return vl
            .replace(H_SPACE_0, H_SPACE)
          // .replace(V_SPACE_0, V_SPACE)
        }
        return vl
      })
      .join(''))
  }

  get indent() {
    return this._indent
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
