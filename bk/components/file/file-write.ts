import assert from 'assert'
import { writeFile } from 'fs'
import { ElementShadow } from '../element-shadow'
import { FileWriteProps } from './file-write.props'
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
  ```
  Write a yaml file
  ```yaml
    - file'write:
        path: /tmp/data.yaml
        content: ${vars.fileData}
        format: yaml  # !optional
  ```
  Write a text file
  ```yaml
    - file'write:
        path: /tmp/data.txt
        content: Hello world
  ```
*/
export class FileWrite extends ElementShadow {
  path?: string
  content: any
  format?: 'json' | 'yaml'
  pretty?: boolean

  constructor(props: FileWriteProps) {
    super()
    Object.assign(this, props)
  }

  async exec() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return await new Promise((resolve, reject) => {
      this.path = this.scene.getPath(this.path || '')
      try {
        assert(this.path)
        this.logger.debug(`Write ${this.format || ''}/${this.pretty ? '(pretty)' : ''} file to "${this.path}"`).trace('%s', this.content)
        const formater = this.getFormater()
        if (formater) {
          this.content = formater.format(this.content)
        }
        writeFile(this.path, this.content, (err: any) => err ? reject(err) : resolve(this.path))
      } catch (err) {
        reject(err)
      }
    })
  }

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
