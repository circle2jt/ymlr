import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
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
          validDirPattern: ^[A-Za-z0-9]                       # Only scan directories which start with by a-zA-Z or a digit
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
  validFilePattern: string | RegExp = /^[a-zA-Z0-9].*?\.ya?ml$/
  validDirPattern: string | RegExp = /^[a-zA-Z0-9]/

  constructor(readonly opts?: YmlrLoadProps) {
    if (typeof opts === 'string') {
      Object.assign(this, { path: opts })
    } else {
      Object.assign(this, opts)
    }
  }

  async exec() {
    assert(this.path || this.content, '"path" or "content" is required')
    let data: any
    if (this.path) {
      data = {
        include: this.path
      }
    } else if (this.content) {
      data = load(this.content)
    }
    const rawResult = await this.handle(data)
    const result = await this.proxy.scene.getVars(rawResult)

    if (this.saveTo && (result?.length || Object.keys(result ?? {}).length)) {
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
        const elemProxy = await this.proxy.rootScene.createAndExecuteElement([], 'include', {}, {
          validDirPattern: this.validDirPattern,
          validFilePattern: this.validFilePattern,
          ...props,
          _errorStack: false,
          returnType: Object
        }) as ElementProxy<Include>
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
