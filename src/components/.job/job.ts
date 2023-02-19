import assert from 'assert'
import { FileStore } from 'src/components/file/file-store'
import { Group } from 'src/components/group/group'
import { GroupItemProps } from 'src/components/group/group.props'
import { JobHandler } from 'src/libs/queue-jobs/job-handler.interface'
import { JobsManager } from 'src/libs/queue-jobs/jobs-manager'
import { JobsManagerOption } from 'src/libs/queue-jobs/jobs-manager.props'
import { FileStorage } from 'src/libs/storage/file-storage'
import { sleep } from 'src/libs/time'
import { JobExecute } from './job-executor'
import { JobProps } from './job.props'

export abstract class Job extends Group<JobProps, GroupItemProps> implements JobHandler {
  queue?: {
    concurrent?: number

    file?: string
    password?: string

    storage?: FileStore
  }

  protected jobsManager?: JobsManager

  constructor({ queue, ...props }: JobProps) {
    super(props)
    Object.assign(this, { queue })
    this.ignoreEvalProps.push('jobsManager')
  }

  onJobInit(jobs: JobExecute[]) {
    return jobs?.map((job: JobExecute) => {
      return new JobExecute(this.runEachOfElements.bind(this), job.data)
    }) || []
  }

  async exec(input?: Record<string, any>) {
    let t: Promise<any> | undefined
    if (this.queue) {
      const opts: JobsManagerOption = {
        jobHandler: this,
        concurrent: this.queue?.concurrent || 1
      }
      if (this.queue.file) {
        opts.storage = new FileStorage(this.logger, this.scene.getPath(this.queue.file), this.queue.password)
      } else if (this.queue.storage) {
        assert(this.queue.storage instanceof FileStore, 'Storage is not valid')
        opts.storage = this.queue.storage
      }
      this.jobsManager = new JobsManager(this.logger, opts)
      t = this.jobsManager.start()
      await sleep(500)
    }
    const proms = new Array<Promise<any>>()
    proms.push(this.execJob(input))
    if (t) proms.push(t)
    await Promise.all(proms)
    return []
  }

  protected async addJobData(jobData: any) {
    if (!this.queue) {
      await this.runEachOfElements(jobData)
    } else {
      await this.jobsManager?.add(new JobExecute(this.runEachOfElements.bind(this), jobData))
    }
  }

  /* Listen to add jobData to run child elements */
  abstract execJob(_input?: Record<string, any>): any

  async stop() {
    await this.jobsManager?.stop()
    this.jobsManager = undefined
  }

  async dispose() {
    await this.stop()
  }
}
