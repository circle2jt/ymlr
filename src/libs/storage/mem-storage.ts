import { type Logger } from '../logger'
import { type StorageInterface } from './storage.interface'

export class MemStorage implements StorageInterface {
  data: any
  constructor(private readonly logger: Logger) {
  }

  load(defaultData?: any) {
    this.logger.debug('Loaded').trace(defaultData)
    this.data = defaultData
    return this.data
  }

  save(data = {}) {
    this.logger.debug('Saved').trace(data)
    this.data = data
  }

  clean() {
    this.data = undefined
  }
}
