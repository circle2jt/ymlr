import { Job } from 'src/libs/queue-jobs/job'

export class SubJob implements Job {
  constructor(private readonly exec: Function, private readonly data: any) { }

  jobExecute() {
    return this.exec(this.data)
  }
}
