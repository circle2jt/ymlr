import { createReadStream } from 'fs'
import readline from 'readline/promises'

export class MDFileProps {
  title = ''
  description?: string
  example?: string
  order: number
  tag?: string
  position?: 'top' | 'bottom'

  constructor() {
    this.order = 999
  }

  toMenu() {
    return `| [${this.title}](#${this.title}) | ${this.description} |`
  }

  toMD() {
    return `
## <a id="${this.title}"></a>${this.title}  
${this.tag ? `\`${this.tag}\`` : ''}  
${this.description}  

Example:  
${this.example}  
`
  }
}

export class MDFileParser {
  result: MDFileProps[] = []

  constructor(private readonly filePath: string) { }

  async analystic() {
    const rl = readline.createInterface({
      input: createReadStream(this.filePath),
      crlfDelay: Infinity
    })
    let isStart = false
    let mdBlock: MDFileProps
    let cur = ''
    let space
    for await (let line of rl) {
      if (!isStart) {
        line = line.trimStart()
        const m = line.match(/^\/\*\*\s*\|\*\*(.*)/)
        if (!m) continue
        isStart = true
        mdBlock = new MDFileProps()
        mdBlock.title = m[1].trim()
        cur = 'des'
        continue
      }
      if (space === undefined) {
        const m = line.match(/^(\s*).+/) || []
        space = m[1] || ''
      }
      line = line.replace(new RegExp(`^${space}`), '')
      const m = line.match(/^@(\w+)( (.*))?\s*$/)
      if (m) {
        cur = m[1]
        line = m[3] || ''
        // @ts-expect-error never mind
        mdBlock[cur] = line
        continue
      }
      if (cur === 'des') {
        // @ts-expect-error never mind
        if (!mdBlock.description) mdBlock.description = ''
        // @ts-expect-error never mind
        else mdBlock.description += '\n'
        // @ts-expect-error never mind
        mdBlock.description += line.trimStart()
        continue
      }
      if (line.trimStart().startsWith('*/')) {
        isStart = false
        space = undefined
        // @ts-expect-error never mind
        this.result.push(mdBlock)
        continue
      }
      if (cur) {
        // @ts-expect-error never mind
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        mdBlock[cur] += '\n' + line
      }
      continue
    }
    return this.result
  }
}
