import assert from 'assert'
import { load } from 'js-yaml'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { YamlType } from '../scene/yaml-type'

/** |**  include
  Include a scene file
  @example
  ```yaml
    - include: ./scene1.yaml
    - include: ./scene2.yaml
  ```
*/
export class Include implements Element {
  readonly proxy!: ElementProxy<this>

  constructor(public file: string) { }

  async exec() {
    assert(this.file)

    const f = new FileRemote(this.file, this.proxy.scene)
    const content = await f.getTextContent()
    const yamlType = new YamlType(this.proxy.scene)
    return load(content, { schema: yamlType.spaceSchema })
  }

  dispose() { }
}
