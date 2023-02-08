import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { MDFileParser, MDFileProps } from './md-file-parser'

export class MDFileOutput {
  mdFileParsers = [] as MDFileParser[]
  mdFileProps = {
    top: [] as MDFileProps[],
    default: [] as MDFileProps[],
    bottom: [] as MDFileProps[]
  }

  private content: string[] = []

  constructor(title?: string) {
    if (title) this.content.push(`# ${title}`, '')
  }

  addMDFileParser(m: MDFileParser) {
    this.mdFileParsers.push(m)
  }

  scanDone() {
    this.mdFileParsers.reduce((sum, e) => {
      sum.default.push(...e.result.flat().filter(e => !e.position))
      sum.top.push(...e.result.flat().filter(e => e.position === 'top'))
      sum.bottom.push(...e.result.flat().filter(e => e.position === 'bottom'))
      return sum
    }, this.mdFileProps)
    this.mdFileProps.bottom.sort((a, b) => (a.order - b.order) || (a.title.localeCompare(b.title)))
    this.mdFileProps.top.sort((a, b) => (a.order - b.order) || (a.title.localeCompare(b.title)))
    this.mdFileProps.default.sort((a, b) => (a.order - b.order) || (a.title.localeCompare(b.title)))
    this.content.push('| Tags | Description |')
    this.content.push('|---|---|')
    this.content.push(...this.mdFileProps.default.map(md => md.toMenu()))
    this.content.push('')
    this.content.push(...this.mdFileProps.top.map(md => md.toMD()))
    this.content.push('')
    this.content.push(...this.mdFileProps.default.map(md => md.toMD()))
    this.content.push('')
    this.content.push(...this.mdFileProps.bottom.map(md => md.toMD()))
  }

  appendContent(...content: string[]) {
    this.content.push(...content)
  }

  appendFile(file: string) {
    return this.appendContent(readFileSync(file).toString('utf8'))
  }

  prependContent(...content: string[]) {
    this.content = [...content, ...this.content]
  }

  prependFile(file: string) {
    return this.prependContent(readFileSync(file).toString('utf8'))
  }

  async save(path: string) {
    await writeFile(path, this.content.join('\n'))
  }
}
