import { StorageInterface } from '../storage/storage.interface'
import { JobHandler } from './job-handler.interface'

export interface JobsManagerOption {
  concurrent?: number
  jobHandler?: JobHandler
  storage?: StorageInterface
}
