import assert from 'assert'
import { writeFile, type WriteFileOptions } from 'fs'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type FileWriteProps } from './file-write.props'
import { JSONFormater } from './write/json.formater'
import { YAMLFormater } from './write/yaml.formater'

/** |**  file'write
  Write data to file
  @example
  Write a json file
  ```yaml
    - file'write:
        path: /tmp/data.json
        content: {
          "say": "hello"
        }
        format: json  # !optional
        pretty: true  # !optional
        opts:             # ref: https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback
          mode: 775
          flag: r         # ref: https://nodejs.org/api/fs.html#file-system-flags
  ```
  Write a yaml file
  ```yaml
    - file'write:
        path: /tmp/data.yaml
        content: ${$vars.fileData}
        format: yaml  # !optional
  ```
  Write a text file
  ```yaml
    - file'write:
        path: /tmp/data.txt
        content: Hello world
  ```
*/
export class FileWrite implements Element {
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  path?: string
  content: any
  format?: 'json' | 'yaml'
  pretty?: boolean
  opts: WriteFileOptions = {}

  constructor(props: FileWriteProps) {
    Object.assign(this, props)
  }

  async exec() {
    return await new Promise((resolve, reject) => {
      this.path = this.proxy.scene.getPath(this.path || '')
      try {
        assert(this.path)
        this.logger.debug(`Write ${this.format || ''}/${this.pretty ? '(pretty)' : ''} file to "${this.path}"`)?.trace('%s', this.content)
        const formater = this.getFormater()
        if (formater) {
          this.content = formater.format(this.content)
        }
        writeFile(this.path, this.content, this.opts, (err: any) => { err ? reject(err) : resolve(this.path) })
      } catch (err) {
        reject(err)
      }
    })
  }

  dispose() { }

  private getFormater() {
    switch (this.format) {
      case 'json':
        return new JSONFormater(this.pretty)
      case 'yaml':
        return new YAMLFormater()
      default:
        return null
    }
  }
}
