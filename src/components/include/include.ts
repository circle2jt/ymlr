import assert from 'assert'
import { readdir } from 'fs/promises'
import { load } from 'js-yaml'
import mergeWith from 'lodash.mergewith'
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
        cached: true                                      # Load file for the first time, the next will get from caches
        file: ./my-scenes                                 # Includes all of files (.yaml, .yml) which in the directory (./my-scenes)
        validFilePattern: ^[a-zA-Z0-9].*?\.stack\.ya?ml$  # Only load files which ends with .stack.yaml

    - include:
        - file1.yaml
        - file2.yaml
        - file3.yaml

    - include:
        cached: true
        files:
          - file1.yaml
          - file2.yaml
          - file3.yaml
  ```
*/
export class Include implements Element {
  readonly proxy!: ElementProxy<this>

  files!: string[]
  cached?: boolean
  _errorStack = true
  _isDir?: boolean
  validFilePattern = '^[a-zA-Z0-9].*?\\.ya?ml$'
  returnType = Array

  private get logger() { return this.proxy.logger }

  constructor(opts: IncludeProps) {
    if (typeof opts === 'string') {
      Object.assign(this, { files: [opts] })
    } else if (Array.isArray(opts)) {
      Object.assign(this, { files: opts })
    } else {
      Object.assign(this, opts)
    }
  }

  async exec() {
    const inputFiles = this.files as string | string[]
    if (typeof inputFiles === 'string') {
      this.files = [inputFiles]
    } else if (Array.isArray(inputFiles)) {
      this.files = inputFiles
    } else {
      this.files = []
    }

    assert(this.files?.length)
    this.files = this.files.flat(1)
    const uri = this.files.join('\n')
    const cached = this.proxy.scene.localCaches.get(uri)
    if (cached) {
      this.logger.trace('Get include data from cached')
      return cached
    }
    const validFilePattern = new RegExp(this.validFilePattern)
    const files: FileRemote[] = []
    for (const file of this.files) {
      const f = new FileRemote(file, this.proxy.scene)
      this._isDir = f.isDirectory
      if (this._isDir) {
        const listFiles = await readdir(f.uri)
        listFiles
          .sort((a, b) => a.localeCompare(b))
          .forEach(file => {
            if (validFilePattern.test(file)) {
              files.push(new FileRemote(join(f.uri, file), this.proxy.scene))
            }
          })
      } else {
        files.push(f)
      }
    }
    if (files.length) {
      const elementProxies = await Promise.all(files.map(async f => {
        const content = await f.getTextContent()
        const yamlType = new YamlType(this.proxy.scene)
        const data = load(content, { schema: yamlType.spaceSchema })
        if (this._errorStack) {
          if (Array.isArray(data)) {
            data.forEach(d => {
              d.errorStack = {
                sourceFile: f.uri
              }
            })
          } else if (typeof data === 'object') {
            (data as any).errorStack = {
              sourceFile: f.uri
            }
          }
        }
        return data
      }))
      const childs = this.getData(elementProxies)
      if (this.cached) {
        this.proxy.scene.localCaches.set(uri, childs)
      }
      return childs
    }
    return []
  }

  dispose() { }

  private getData(childs: any[]): any {
    if (this.returnType === Array) return childs.flat(1)
    return childs
      .flat(1)
      .reduce((sum, item) => {
        Include.mergeFiles(sum, item)
        sum = mergeWith(sum, item, (objValue: any, srcValue: any) => {
          if (Array.isArray(objValue) && Array.isArray(srcValue)) {
            return objValue.concat(srcValue)
          }
          Include.mergeFiles(objValue, srcValue)
        })
        return sum
      }, {})
  }

  private static mergeFiles(objValue: any, srcValue: any) {
    if (objValue?.include?.files && typeof objValue?.include?.files === 'string') {
      objValue.include.files = [objValue.include.files]
    }
    if (srcValue?.include?.files && typeof srcValue?.include?.files === 'string') {
      srcValue.include.files = [srcValue.include.files]
    }
  }
}
