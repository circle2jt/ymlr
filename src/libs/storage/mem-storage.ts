import { type Logger } from '../logger'
import { type StorageInterface } from './storage.interface'

export class MemStorage<T = any> implements StorageInterface {
  data: any
  constructor(private readonly logger: Logger) { }

  load(defaultData?: T) {
    this.logger.debug('Loaded')?.trace(defaultData)
    this.data = defaultData
    return this.data
  }

  save(data: T) {
    if (data == null) return false
    this.logger.debug('Saved')?.trace(data)
    this.data = data
    return true
  }

  clean() {
    this.data = undefined
  }
}
