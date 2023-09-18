import { type ServerResponse } from 'http'

export interface SubJobDataInfo {
  path: string
  method: string
  headers: any
  query: any
  body: any
}

export interface SubJobData {
  jobData: any
  jobInfo: SubJobDataInfo
  jobRes: ServerResponse | undefined
}
