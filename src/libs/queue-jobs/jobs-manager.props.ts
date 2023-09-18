import { type StorageInterface } from '../storage/storage.interface'
import { type JobHandler } from './job-handler.interface'

export interface JobsManagerOption {
  concurrent?: number
  jobHandler?: JobHandler
  storage?: StorageInterface
}
