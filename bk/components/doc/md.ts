import chalk from 'chalk'
import { statSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { ElementShadow } from '../element-shadow'
import { MDDocProps } from './md.props'
import { MDFileOutput } from './parser/md-file-output'
import { MDFileParser } from './parser/md-file-parser'

/** |**  md'doc
  Generate comment in a file to document
  @tag doc
  @order 3
  @example
  ```yaml
    - doc'md:
        includeDirs:
          - /workspaces/ymlr/src/components/doc/md.ts
        includePattern: "^(?!.*\\.spec\\.ts$)"
        excludeDirs:
          - node_modules
        prependMDs:                                     # Prepend content in the document (Optional)
          - path: ${utils.curDir}/../INSTALLATION.md    # |- {path}: Read file content then copy it into document
          - ---                                         # |- string: Markdown content
        appendMDs:                                      # Append content in the document
          - ---
          - "### Have fun :)"
        saveTo: /workspaces/ymlr/test/thanh.doc.md
  ```
  Declare doc in file
  [Example](https://github.com/circle2jt/ymlr/blob/main/src/components/doc/md.ts)
 */
export class MDDoc extends ElementShadow {
  title?: string
  saveTo?: string
  includeDirs?: string[]
  excludeDirs?: string[]
  includePattern: RegExp = /.+/
  prependMDs?: Array<string | { path: string }>
  appendMDs?: Array<string | { path: string }>
  count = {
    handled: 0,
    ignored: 0
  }

  constructor(props: MDDocProps) {
    super()
    if (!Array.isArray(props.includeDirs)) props.includeDirs = [props.includeDirs]
    if (!Array.isArray(props.excludeDirs)) props.excludeDirs = [props.excludeDirs]
    if (props.includePattern) props.includePattern = new RegExp(props.includePattern)
    Object.assign(this, props)
  }

  async exec() {
    this.logger.addIndent()
    try {
      if (!this.includeDirs?.length || !this.saveTo) return
      this.logger.debugBlock(true)
      this.includeDirs = this.includeDirs.map(dir => this.scene.getPath(dir))
      this.saveTo = this.scene.getPath(this.saveTo)
      const mdFileOutput = new MDFileOutput(this.title)

      await Promise.all(this.includeDirs.map(async dirPath => await this.scanDir(dirPath, mdFileOutput)))
      mdFileOutput.scanDone()

      const preContents = await Promise.all<string>(this.prependMDs?.map(async opt => {
        if (typeof opt === 'string') return opt
        const buf = await readFile(this.scene.getPath(opt.path))
        return buf.toString('utf8')
      }) || [])
      mdFileOutput.prependContent(...preContents)

      const postContents = await Promise.all<string>(this.appendMDs?.map(async opt => {
        if (typeof opt === 'string') return opt
        const buf = await readFile(this.scene.getPath(opt.path))
        return buf.toString('utf8')
      }) || [])
      mdFileOutput.appendContent(...postContents)

      await mdFileOutput.save(this.saveTo)

      this.logger.debugBlock(false)

      this.logger.info('Exported/Total files\t%d/%d', this.count.handled, this.count.handled + this.count.ignored)
    } finally {
      this.logger.removeIndent()
    }
  }

  private async scanDir(dirPath: string, mdFileOutput: MDFileOutput) {
    if (this.excludeDirs?.find(e => dirPath.includes(e)) || !this.includePattern?.test(dirPath)) return
    if (statSync(dirPath).isFile()) {
      const isGot = await this.scanFile(dirPath, mdFileOutput)
      if (isGot) {
        this.count.handled++
        this.logger.debug('%s %s', chalk.green('✓'), chalk.gray(dirPath))
      } else {
        this.count.ignored++
        this.logger.debug('%s %s', chalk.red('✗'), chalk.gray(dirPath))
      }
    } else {
      const items = await readdir(dirPath)
      await Promise.all(items.map(async itemPath => await this.scanDir(join(dirPath, itemPath), mdFileOutput)))
    }
  }

  private async scanFile(filePath: string, mdFileOutput: MDFileOutput) {
    const mdFileParser = new MDFileParser(filePath)
    const rs = await mdFileParser.analystic()
    mdFileOutput.addMDFileParser(mdFileParser)
    return !!rs.length
  }
}
