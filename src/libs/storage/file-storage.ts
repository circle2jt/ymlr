import assert from 'assert'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { AES } from '../encrypt/aes'
import { type Logger } from '../logger'
import { type StorageInterface } from './storage.interface'

export interface FileStoreConfig { file?: string, pwd?: string }

export class FileStorage<T = any> implements StorageInterface {
  private readonly file!: string
  private readonly secure?: AES

  constructor(private readonly logger: Logger, config: FileStoreConfig = {}) {
    assert(config.file, 'file is required')
    this.file = config.file
    if (config.pwd) this.secure = new AES(config.pwd)
  }

  load<T>(defaultData?: any) {
    if (!existsSync(this.file)) {
      if (defaultData != null) {
        this.save(defaultData)
      }
      return defaultData as T
    }
    this.logger.debug('Loaded\t%s', this.file)
    const content = readFileSync(this.file).toString()
    return JSON.parse(this.secure?.decrypt(content) || content) as T
  }

  save(data: T) {
    if (data == null) return false
    this.logger.debug('Saved\t%s', this.file)
    const content = JSON.stringify(data)
    writeFileSync(this.file, this.secure?.encrypt(content) || content)
    return true
  }

  clean() {
    if (existsSync(this.file)) {
      unlinkSync(this.file)
    }
  }
}
