import assert from 'assert'
import { AES } from 'src/libs/encrypt/aes'
import { FileRemote } from 'src/libs/file-remote'
import { parse } from 'yaml'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { prefixPassword } from '../scene/constants'

/** |**  includes
  Replace steps in a file to current step.
  "includes" is lightweight than scene.
  It's use same variable scope in the scene which included itself
  @example
  Load a simple file
  ```yaml
    - name: Include a file into here      # => this is a file 1
      includes: ./file1.yaml
  ```

  Load a encrypted file
  ```yaml
    - name: Include a file into here      # => this is a file 1
      includes:
        path: ./file1.yaml
        password: $PASSWORD
  ```

  `file1.yaml`
  ```yaml
    - echo: this is a file 1
  ```
*/
export class Includes implements Element {
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
        const encryptor = new AES(`${prefixPassword}${this.password}`)
        content = encryptor.decrypt(content)
      } catch (err: any) {
        if (err?.code === 'ERR_OSSL_BAD_DECRYPT') {
          throw new Error(`Password to decrypt the file "${this.path}" is not valid`)
        }
        throw err
      }
    }
    assert(content)
    const childs = parse(content)
    assert(Array.isArray(childs), 'Including file must be array of steps')
    return childs
  }

  dispose() { }
}
