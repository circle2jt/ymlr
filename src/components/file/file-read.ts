import assert from 'assert'
import { FileRemote } from 'src/libs/file-remote'
import { ElementShadow } from '../element-shadow'
import { FileReadProps } from './file-read.props'
import { JSONFormater } from './read/json.formater'
import { YAMLFormater } from './read/yaml.formater'

/** |**  file'read
  Read a file then load data into a variable
  @example
  Read a json file
  ```yaml
    - file'read:
        path: /tmp/data.json
        vars: fileData
        format: json  # !optional
  ```
  Read a yaml file
  ```yaml
    - file'read:
        path: /tmp/data.yaml
        vars: fileData
        format: yaml  # !optional
  ```
  Read a text file
  ```yaml
    - file'read:
        path: /tmp/data.txt
        vars: fileContent
  ```
*/
export class FileRead extends ElementShadow {
  path = ''
  format?: 'json' | 'yaml'

  constructor(props: FileReadProps) {
    super()
    Object.assign(this, props)
  }

  async exec() {
    assert(this.path)
    const file = new FileRemote(this.path, this.scene)
    let content = await file.getTextContent()
    this.logger.debug(`Read ${this.format || ''} file "${file.uri}"`).trace('%s', content)
    const formater = this.getFormater()
    if (formater) content = formater.format(content)
    return content
  }

  private getFormater() {
    switch (this.format) {
      case 'json':
        return new JSONFormater()
      case 'yaml':
        return new YAMLFormater()
      default:
        return null
    }
  }
}
