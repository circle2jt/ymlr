import assert from 'assert'
import { type FileStorage } from 'src/libs/storage/file-storage'
import { StoreFactory } from 'src/libs/storage/store-factory'
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

    - js: |
        const { fileDB } = vars
        fileDB.data.push('item 1')
        fileDB.data.push('item 2')
        // Save data to file
        fileDB.save()

    - echo: ${$vars.fileDB.data}   # => ['item 1', 'item 2']
  ```
*/
export class FileStore implements Element {
  readonly ignoreEvalProps = ['data', 'store']
  readonly proxy!: ElementProxy<this>

  get logger() {
    return this.proxy.logger
  }

  get store() {
    return this._storage
  }

  path?: string
  initData?: any
  password?: string

  data: any

  private _storage?: FileStorage

  constructor(props?: FileStoreProps) {
    globalThis.copyProps(this, props)
  }

  async exec() {
    this.path = this.proxy.getPath(this.path || '')
    assert(this.path, 'path is required')
    this._storage = StoreFactory.Create<FileStorage>(this.logger, {
      type: 'file',
      file: this.path,
      pwd: this.password
    })
    this.data = this.load()
    return this.data
  }

  load() {
    return this._storage?.load(this.initData)
  }

  save() {
    this._storage?.save(this.data)
  }

  dispose() { }
}
