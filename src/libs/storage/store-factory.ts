import { type Logger } from '../logger'
import { FileStorage, type FileStoreConfig } from './file-storage'
import { MemStorage } from './mem-storage'
import { type StorageInterface } from './storage.interface'

export class StoreFactory {
  static Create<T extends StorageInterface>(logger: Logger, config: FileStoreConfig & { type?: 'file' } = {}): T {
    const { type, ..._config } = config
    let store: StorageInterface
    switch (type) {
      case 'file':
        store = new FileStorage(logger, _config)
        break
      default:
        store = new MemStorage(logger)
        break
    }
    return store as T
  }
}
