import assert from 'assert'
import { ElementShadow } from 'src/components/element-shadow'
import { FileStorage } from 'src/libs/storage/file-storage'
import { FileStoreProps } from './file-store.props'

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

    - echo: ${vars.fileDB.data}   # => ['item 1', 'item 2']
  ```
*/
export class FileStore extends ElementShadow {
  $$ignoreEvalProps = ['storage']
  path?: string
  initData?: any
  password?: string

  storage?: FileStorage

  get data() {
    return this.result
  }

  constructor(props?: FileStoreProps) {
    super()
    Object.assign(this, props)
  }

  async exec() {
    this.path = this.scene.getPath(this.path || '')
    assert(this.path)
    this.storage = new FileStorage(this.logger, this.path, this.password)
    return this.load()
  }

  load() {
    return this.storage?.load(this.initData)
  }

  save() {
    this.storage?.save(this.data)
  }
}
