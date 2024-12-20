import assert from 'assert'
import { FileStorage } from 'src/libs/storage/file-storage'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type FileStoreProps } from './file-store.props'

/** |**  file'store
  Store data to file
  @example
  ```yaml
    - file'store:
        path: /tmp/data.json      # Path to store data
        password:                 # Password to encrypt/decrypt data content
        initData: []              # Default data will be stored when file not found
  ```

  Use in global by reference
  ```yaml
    - file'store:
        path: /tmp/data.yaml
        initData: []
      vars:
        fileDB: ${this}         # Store this element to "fileDB" in vars

    - exec'js: |
        const { fileDB } = vars
        fileDB.data.push('item 1')
        fileDB.data.push('item 2')
        // Save data to file
        fileDB.save()

    - echo: ${$vars.fileDB.data}   # => ['item 1', 'item 2']
  ```
*/
export class FileStore implements Element {
  readonly ignoreEvalProps = ['data']
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger }

  path?: string
  initData?: any
  password?: string

  data: any

  #storage?: FileStorage

  constructor(props?: FileStoreProps) {
    Object.assign(this, props)
  }

  async exec() {
    this.path = this.proxy.getPath(this.path || '')
    assert(this.path)
    this.#storage = new FileStorage(this.logger, this.path, this.password)
    this.data = this.load()
    return this.data
  }

  load() {
    return this.#storage?.load(this.initData)
  }

  save() {
    this.#storage?.save(this.data)
  }

  dispose() { }
}
