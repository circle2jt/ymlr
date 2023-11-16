import assert from 'assert'
import { readdir } from 'fs/promises'
import { load } from 'js-yaml'
import { join } from 'path'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { YamlType } from '../scene/yaml-type'
import { type IncludeProps } from './include.props'

/** |**  include
  Include a scene file or list scene files in a folder
  @example
  ```yaml
    - include: ./my-scenes/scene1.yaml  # Includes a only file "scene1.yaml"

    - include:
        file: ./my-scenes               # Includes all of files (.yaml, .yml) which in the directory (./my-scenes)
        cached: true                    # Load file for the first time, the next will get from caches
  ```
*/
export class Include implements Element {
  readonly proxy!: ElementProxy<this>

  file!: string
  cached?: boolean

  private get logger() { return this.proxy.logger }

  constructor(public opts: IncludeProps) {
    if (typeof opts === 'string') {
      Object.assign(this, { file: opts })
    } else {
      Object.assign(this, opts)
    }
  }

  async exec() {
    assert(this.file)
    const f = new FileRemote(this.file, this.proxy.scene)
    const cached = this.proxy.scene.localCaches.get(f.uri)
    if (cached) {
      this.logger.trace('Get include data from cached')
      return cached
    }
    const files = []
    const isDir = f.isDirectory
    if (isDir) {
      const listFiles = await readdir(f.uri)
      listFiles
        .sort((a, b) => a.localeCompare(b))
        .forEach(file => {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            files.push(new FileRemote(join(f.uri, file), this.proxy.scene))
          }
        })
    } else {
      files.push(f)
    }
    if (files.length) {
      const elementProxies = await Promise.all(files.map(async f => {
        const content = await f.getTextContent()
        const yamlType = new YamlType(this.proxy.scene)
        return load(content, { schema: yamlType.spaceSchema })
      }))
      const childs = elementProxies.flat(1)
      if (this.cached) {
        this.proxy.scene.localCaches.set(f.uri, childs)
      }
      return childs
    }
    return []
  }

  dispose() { }
}
