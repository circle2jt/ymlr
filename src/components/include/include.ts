import assert from 'assert'
import { lstat, readdir } from 'fs/promises'
import { load } from 'js-yaml'
import mergeWith from 'lodash.mergewith'
import { basename, dirname, join } from 'path'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { YamlType } from '../scene/yaml-type'
import { type IncludeProps } from './include.props'

/** |**  include
  Include a scene file or list scene files in a folder
  @example
  ```yaml
    - include: ./my-scenes/scene1.yaml                    # Includes a only file "scene1.yaml"

    - include:
        cached: true                                      # Load file for the first time, the next will get from caches
        files: ./my-scenes                                # Includes all of files (.yaml, .yml) which in the directory (./my-scenes)
        validFilePattern: ^[a-zA-Z0-9].*?\.stack\.ya?ml$  # Only load files which ends with .stack.yaml
        validDirPattern: ^[a-zA-Z0-9]                     # Only scan files in these valid directories
        maxDeepLevel: 0                                   # Max deep child directories to scan files

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
  maxDeepLevel = 0
  cached?: boolean
  _errorStack = true
  _isDir?: boolean
  validFilePattern: string | RegExp = /^[a-zA-Z0-9].*?\.ya?ml$/
  validDirPattern: string | RegExp = /^[a-zA-Z0-9]/
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

  async exec(): Promise<Array<ElementProxy<Element>>> {
    const inputFiles = this.files as string | string[]
    if (typeof inputFiles === 'string') {
      this.files = [inputFiles]
    } else if (Array.isArray(inputFiles)) {
      this.files = inputFiles
    } else {
      this.files = []
    }

    assert(this.files?.length)
    this.files = this.files.flat(1).filter(f => !!f)
    if (!this.files.length) {
      this.logger.warn('"include.files" is empty')
      return []
    }
    const uri = this.files.join('\n')
    const cached = this.proxy.scene.localCaches.get(uri)
    if (cached) {
      this.logger.trace('Get include data from cached')
      return cached
    }
    const validFilePattern = this.validFilePattern instanceof RegExp ? this.validFilePattern : new RegExp(this.validFilePattern)
    const validDirPattern = this.validDirPattern instanceof RegExp ? this.validDirPattern : new RegExp(this.validFilePattern)
    const files: FileRemote[] = []
    for (const file of this.files) {
      const f = new FileRemote(file, this.proxy)
      this._isDir = f.isDirectory

      if (this._isDir) {
        const scanDir = async (path: string, level: number, maxDeepLevel: number) => {
          if (level > maxDeepLevel) {
            this.logger.trace('ignore deep level directory %s', path)
            return
          }
          const baseName = basename(path)
          if (!validDirPattern.test(baseName)) {
            this.logger.trace('ignore invalid directory %s', path)
            return
          }
          this.logger.trace('scan directory %s', path)
          const listFiles = await readdir(path)
          const proms = listFiles
            .sort((a, b) => a.localeCompare(b))
            .map(async (file: string) => {
              const newPath = join(path, file)
              const fileStats = await lstat(newPath)
              if (fileStats.isDirectory()) {
                const rs = await scanDir(newPath, level + 1, maxDeepLevel) as FileRemote[]
                return rs?.flat(1).filter(f => !!f)
              }
              if (fileStats.isFile()) {
                if (validFilePattern.test(file)) {
                  this.logger.trace('valid file %s', newPath)
                  return new FileRemote(newPath, this.proxy)
                }
              }
              return null
            })
          return proms.length ? await Promise.all(proms) : []
        }
        const allFiles = await scanDir(f.uri, 0, this.maxDeepLevel)
        allFiles?.flat(1).forEach(remoteFile => {
          if (remoteFile) {
            files.push(remoteFile)
          }
        })
        continue
      }
      files.push(f)
    }
    if (files.length) {
      const elementProxies = await Promise.all(files.map(async f => {
        const content = await f.getTextContent()
        const yamlType = new YamlType(this.proxy.scene)
        const data: any = load(content, { schema: yamlType.spaceSchema })
        if (this._errorStack) {
          const curDir = dirname(f.uri)
          if (Array.isArray(data)) {
            data.forEach((d: any) => {
              Object.assign(d, {
                _curDir: curDir,
                errorStack: {
                  sourceFile: f.uri
                }
              })
            })
          } else if (data !== null && typeof data === 'object') {
            Object.assign(data, {
              _curDir: curDir,
              errorStack: {
                sourceFile: f.uri
              }
            })
          }
        }
        return data
      }))
      const childs = this.getData(elementProxies)
      if (Array.isArray(childs)) {
        const includes = childs
          .map((e: any, i: number) => e.include ? { idx: i, include: e.include, _curDir: e._curDir } : undefined)
          .filter((e: any) => e)
        if (includes.length) {
          const allRuns: Array<{ idx: number, runs: Array<ElementProxy<Element>> }> = await Promise.all(includes
            .map(async (e: any) => {
              const elemProxy = await this.proxy.scene.createAndExecuteElement([], 'include', {
                _curDir: e._curDir
              }, e.include)
              return { idx: e.idx, runs: elemProxy?.result || [] }
            })
          )
          allRuns
            .reverse()
            .forEach((allRunItem) => {
              childs.splice(allRunItem.idx, 1, ...allRunItem.runs)
            })
        }
      }
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
