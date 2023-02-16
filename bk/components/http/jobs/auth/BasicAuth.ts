import { Base64 } from 'src/libs/encrypt/base64'
import { SubJobData } from '../sub-job-data.props'
import { IVerify } from './IVerify'

export class BasicAuth implements IVerify {
  hash: string

  constructor(username: string, password = '') {
    this.hash = 'Basic ' + new Base64().encrypt(`${username}:${password}`)
  }

  verify(jobData: SubJobData) {
    const userToken = jobData.jobInfo.headers.authorization || jobData.jobInfo.query.authorization
    return this.hash === userToken
  }
}
