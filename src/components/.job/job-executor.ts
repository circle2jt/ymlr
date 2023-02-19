import { Job } from 'src/libs/queue-jobs/job'

export class JobExecute implements Job {
  constructor(private readonly exec: Function, public readonly data: any) { }

  jobExecute() {
    return this.exec(this.data)
  }
}
