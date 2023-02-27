import assert from 'assert'
import { FileRemote } from 'src/libs/file-remote'
import { parse } from 'yaml'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { prefixPassword } from '../scene/constants'

/** |**  import
  Copy a file to replace it
  @example
  Load a simple file
  ```yaml
    - import: ./file1.yaml
  ```

  Load a encrypted file
  ```yaml
    - import:
        path: ./file1.yaml
        password: $PASSWORD
  ```

  `file1.yaml`
  ```yaml
    - echo: this is a file 1
  ```
*/
export class Import implements Element {
  proxy!: ElementProxy<this>
  private readonly path!: string
  private readonly password?: string

  constructor(props: string | { path: string, password?: string }) {
    if (typeof props === 'string') {
      this.path = props
    } else {
      Object.assign(this, props)
    }
  }

  async exec() {
    assert(this.path)
    const fr = new FileRemote(this.path, this.proxy.scene)
    let content = await fr.getTextContent()
    if (this.password) {
      try {
        content = this.proxy.rootScene.globalUtils.aes.decrypt(content, `${prefixPassword}${this.password}`)
      } catch (err: any) {
        if (err?.code === 'ERR_OSSL_BAD_DECRYPT') {
          throw new Error(`Password to decrypt the file "${this.path}" is not valid`)
        }
        throw err
      }
    }
    assert(content)
    const childs = parse(content)
    return Array.isArray(childs) ? childs : [childs]
  }

  dispose() { }
}
