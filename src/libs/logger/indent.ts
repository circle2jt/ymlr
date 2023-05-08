import chalk from 'chalk'

export class Indent {
  indentString = ''

  constructor(private indent = 0) {
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
  }

  format(str: string) {
    return `${this.indentString}${str}`
  }

  clone() {
    return new Indent(this.indent)
  }

  private getIndentString(indent: number) {
    const str = new Array(indent).fill('╎').join('')
    return str && chalk.gray.dim(str)
  }
}
