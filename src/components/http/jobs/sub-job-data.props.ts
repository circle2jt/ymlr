import { ServerResponse } from 'http'

export interface SubJobDataInfo {
  path: string
  method: string
  headers: any
  query: any
}

export interface SubJobData {
  jobData: any
  jobInfo: SubJobDataInfo
  jobRes: ServerResponse | undefined
}
