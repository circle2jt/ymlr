import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { type Logger } from '../logger'
import { type StorageInterface } from '../storage/storage.interface'
import { type Job } from './job'
import { type JobHandler } from './job-handler.interface'
import { type JobsManagerOption } from './jobs-manager.props'

export class JobsManager {
  private concurrent = 1
  private resolve?: (data?: any) => any
  private reject?: (error: Error) => any
  private runningJobsCount = 0
  private error?: any

  private readonly dbJobs = new Array<Job>()
  private readonly queueJobs = new Array<Job>()
  private readonly jobHandler?: JobHandler
  private readonly storage?: StorageInterface

  constructor(private readonly logger: Logger, opts: JobsManagerOption) {
    Object.assign(this, opts)
  }

  async add(job: Job) {
    this.dbJobs.push(job)
    await this.storage?.save(this.dbJobs)
    this.queueJobs.push(job)
    this.pullJobToRun()
  }

  pullJobToRun() {
    if (!this.resolve || !this.reject) return
    if (!this.concurrent) {
      if (!this.runningJobsCount) {
        this.error ? this.reject(this.error) : this.resolve()
      }
      return
    }
    if (this.queueJobs.length && this.runningJobsCount < this.concurrent) {
      const job = this.queueJobs.shift()
      if (job) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setImmediate(async (job: Job) => {
          this.runningJobsCount++
          this.logger.debug('Pulled a job')?.trace('%j', job)
          try {
            if (this.jobHandler?.onJobRun) await this.jobHandler.onJobRun(job)
            await job.jobExecute()
            this.logger.debug('Job successed      ')?.trace('%j', job)
            if (this.jobHandler?.onJobSuccess) await this.jobHandler.onJobSuccess(job)
            this.dbJobs.splice(this.dbJobs.indexOf(job), 1)
            await this.storage?.save(this.dbJobs)
          } catch (err1: any) {
            this.logger.warn(job, 'Job failed         \t%s', err1?.message)
            try {
              if (!this.jobHandler?.onJobFailure) throw err1
              const isRetry = await this.jobHandler.onJobFailure(err1, job)
              if (isRetry) this.queueJobs.push(job)
            } catch (err2: any) {
              this.logger.error(job, 'Jobs manager stoped\t%s', err2?.message)
              this.concurrent = 0
              this.error = err2
            }
          } finally {
            this.runningJobsCount--
            if (this.jobHandler?.onJobDone) await this.jobHandler.onJobDone(job)
          }
          this.pullJobToRun()
        }, job)
      }
    }
  }

  async start() {
    if (this.jobHandler?.onJobInit) {
      const jobsData = await this.storage?.load([]) as any[]
      const jobs = await this.jobHandler?.onJobInit(jobsData)
      if (jobs) {
        const allJobs = Array.isArray(jobs) ? jobs : [jobs]
        for (const job of allJobs) {
          await this.add(job)
        }
      }
    }
    new Array(this.concurrent)
      .fill(null)
      .forEach(() => { this.pullJobToRun() })
    await Promise.race([
      new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      }),
      UtilityFunctionManager.Instance.hang
    ])
  }

  stop() {
    this.concurrent = 0
    this.pullJobToRun()
  }
}
