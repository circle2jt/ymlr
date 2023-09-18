import chalk from 'chalk'

export class Indent {
  indentString = ''
  indent = 0
  indentStringLength = 0

  constructor(indent = 0) {
    if (indent) {
      this.add(indent)
    }
  }

  add(indent = 1) {
    this.update(this.indent + indent)
  }

  update(indent: number) {
    this.indent = indent
    this.indentString = this.getIndentString(this.indent)
    this.indentStringLength = this.indent * 2
  }

  format(str: string) {
    return `${this.indentString}${str}`
  }

  clone() {
    return new Indent(this.indent)
  }

  private getIndentString(indent: number) {
    const str = new Array(indent).fill('╎ ').join('')
    return str && chalk.gray.dim(str)
  }
}
