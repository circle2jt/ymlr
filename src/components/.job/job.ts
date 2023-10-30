import assert from 'assert'
import { FileStore } from 'src/components/file/file-store'
import { JobHandler } from 'src/libs/queue-jobs/job-handler.interface'
import { JobsManager } from 'src/libs/queue-jobs/jobs-manager'
import { JobsManagerOption } from 'src/libs/queue-jobs/jobs-manager.props'
import { FileStorage } from 'src/libs/storage/file-storage'
import { sleep } from 'src/libs/time'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import Group from '../group'
import { GroupItemProps, GroupProps } from '../group/group.props'
import { JobExecute } from './job-executor'
import { JobProps } from './job.props'

export abstract class Job implements JobHandler, Element {
  readonly ignoreEvalProps = ['jobsManager']
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>
  get logger() {
    return this.proxy.logger
  }

  queue?: {
    concurrent?: number

    file?: string
    password?: string

    storage?: FileStore | ElementProxy<FileStore>
  }

  protected jobsManager?: JobsManager

  constructor({ queue }: JobProps) {
    Object.assign(this, { queue })
  }

  onJobInit(jobs: JobExecute[]) {
    return jobs?.map((job: JobExecute) => {
      return new JobExecute(this.innerRunsProxy.exec.bind(this.innerRunsProxy), job.data)
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
        opts.storage = new FileStorage(this.logger, this.proxy.scene.getPath(this.queue.file), this.queue.password)
      } else if (this.queue.storage) {
        let storage: FileStore
        if (this.queue.storage instanceof ElementProxy) {
          storage = this.queue.storage.element
        } else {
          storage = this.queue.storage
        }
        assert(storage instanceof FileStore, 'Storage is not valid')
        opts.storage = storage
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
      await this.innerRunsProxy.exec(jobData)
    } else {
      await this.jobsManager?.add(new JobExecute(this.innerRunsProxy.exec.bind(this.innerRunsProxy), jobData))
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
