import { type Job } from './job'

export interface JobHandler {
  onJobInit?: (jobData: any) => Job | Job[] | Promise<Job | Job[]>
  onJobRun?: (job: Job) => any
  onJobSuccess?: (job: Job) => any
  onJobFailure?: (error: any, job: Job) => boolean | Promise<boolean>
  onJobDone?: (job: Job) => any
}
