import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { AES } from '../encrypt/aes'
import { type Logger } from '../logger'
import { type StorageInterface } from './storage.interface'

export class FileStorage implements StorageInterface {
  private readonly secure?: AES

  constructor(private readonly logger: Logger, private readonly file: string, pwd?: string) {
    if (pwd) this.secure = new AES(pwd)
  }

  load(defaultData?: any) {
    if (!existsSync(this.file)) {
      if (defaultData !== undefined && defaultData !== null) {
        this.save(defaultData)
      }
      return defaultData
    }
    this.logger.debug('Loaded\t%s', this.file)
    const content = readFileSync(this.file).toString()
    return JSON.parse(this.secure?.decrypt(content) || content)
  }

  save(data = {}) {
    this.logger.debug('Saved\t%s', this.file)
    const content = JSON.stringify(data)
    writeFileSync(this.file, this.secure?.encrypt(content) || content)
  }

  clean() {
    if (existsSync(this.file)) {
      unlinkSync(this.file)
    }
  }
}
