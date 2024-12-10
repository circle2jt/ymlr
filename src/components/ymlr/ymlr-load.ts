import assert from 'assert'
import { lstatSync } from 'fs'
import { readdir } from 'fs/promises'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { join } from 'path'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Include } from '../include/include'
import { type YmlrLoadProps } from './ymlr-load.props'

/** |**  ymlr'load
  Merge, replace env variable in yaml files to a yaml file
  @example
  ```yaml
    vars:
      myRegistry: registry.docker.lan:5000
      rootEnv:
        serverDir: /home/myapp
    runs:
      - ymlr'load:
          path: /test/test.stack.yaml                         # Path of dir or file which is need to eval variable or auto includes
          saveTo: /test/test.done.stack.yaml                  # Path of the target file which is merged and replaced variables
          validFilePattern: ^[a-zA-Z0-9].*?\.stack\.ya?ml$    # Only handle files which is ends with .stack.yaml
  ```

  file `test.stack.yaml`
  ```yaml
    include:                                # Support "include" tag to include files or folders
      files:
        - /app/nfs.stack.yaml

    services:
      smb:
        user: "0:0"
        image: ${ $v.myRegistry }/smb
        container_name: smb
        restart: always
        network_mode: host
        volumes:
          - /mnt:/mnt:z,shared
          - /home/orangepi:/home/orangepi:z,shared
          - ${ $v.rootEnv.serverDir }/stacks/smb/config/smb.conf:/etc/samba/smb.conf:ro
          - ${ $v.rootEnv.serverDir }/stacks/smb/config/usermap.txt:/etc/samba/usermap.txt:ro
  ```

  file `nfs.stack.yaml`
  ```yaml
    services:
      nfs:
        image: ${ $v.myRegistry }/nfs
  ```

  file `test.done.stack.yaml`
  ```yaml
    services:
      nfs:
        image: registry.docker.lan:5000/nfs
      smb:
        user: "0:0"
        image: registry.docker.lan:5000/smb
        container_name: smb
        restart: always
        network_mode: host
        volumes:
          - /mnt:/mnt:z,shared
          - /home/orangepi:/home/orangepi:z,shared
          - /home/myapp/stacks/smb/config/smb.conf:/etc/samba/smb.conf:ro
          - /home/myapp/stacks/smb/config/usermap.txt:/etc/samba/usermap.txt:ro
  ```
*/
export class YmlrLoad implements Element {
  readonly proxy!: ElementProxy<this>
  get logger() {
    return this.proxy.logger
  }

  path?: string
  content?: string
  saveTo?: string
  validFilePattern = '^[a-zA-Z0-9].*?\\.ya?ml$'

  constructor(readonly opts?: YmlrLoadProps) {
    if (typeof opts === 'string') {
      Object.assign(this, { path: opts })
    } else {
      Object.assign(this, opts)
    }
  }

  async exec() {
    let content = this.content
    if (!content) {
      assert(this.path)
      const validFilePattern = new RegExp(this.validFilePattern)
      const file = new FileRemote(this.path, this.proxy.scene)
      if (file.isDirectory) {
        const dirs = await readdir(file.uri)
        const childFiles = dirs
          .filter(name => validFilePattern.test(name) && !lstatSync(join(file.uri, name)).isDirectory())
          .map(name => {
            return {
              name,
              path: join(file.uri, name)
            }
          })
        if (!childFiles.length) {
          throw new Error(`Could not found to load the file "${file.uri}"`)
        }
        content = `
include:
  files: [${childFiles.map(file => `"${file.path}"`).join(',')}]
`
        this.logger.trace('Auto includes files in the dir')
        this.logger.trace('☐ %s', file.uri)
        this.logger.emit('addIndent')
        childFiles.forEach(file => this.logger.trace(file.name))
        this.logger.emit('removeIndent')
      } else {
        content = await file.getTextContent()
      }
    }
    assert(content)

    const data = load(content)
    let result = await this.handle(data)
    result = await this.proxy.scene.getVars(result)

    if (this.saveTo) {
      await this.proxy.scene.createAndExecuteElement([], "file'write", {}, {
        path: this.saveTo,
        content: result,
        format: 'yaml'
      })
    }

    return result
  }

  dispose() { }

  private async handle(data: any): Promise<any> {
    if (!data) return data
    if (Array.isArray(data)) {
      const newData: any[] = []
      for (const item of data) {
        const rs = await this.handle(item)
        newData.push(rs)
      }
      return newData
    }
    if (typeof data === 'object') {
      if (data.include) {
        const { include: opts, ...others } = data
        let props: any = {}
        if (typeof opts === 'string') {
          props = { files: [opts] }
        } else if (Array.isArray(opts)) {
          props = { files: opts }
        } else {
          props = opts
        }
        props._errorStack = false
        props.returnType = Object
        const elemProxy = await this.proxy.rootScene.createAndExecuteElement([], 'include', {}, props) as ElementProxy<Include>
        const newData: any = await this.handle(elemProxy?.result)
        data = merge(newData, others)
        const rs = await this.handle(data)
        return rs
      }
      const newData: any = {}
      for (const key of Object.keys(data)) {
        newData[key] = await this.handle(data[key])
      }
      return newData
    }
    return data
  }
}
