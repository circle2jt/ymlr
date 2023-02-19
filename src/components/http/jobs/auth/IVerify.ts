import { SubJobData } from '../sub-job-data.props'

export interface IVerify {
  verify: (clientHash: SubJobData) => boolean | Promise<boolean>
}
