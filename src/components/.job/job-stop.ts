import { ElementShadow } from 'src/components/element-shadow'
import { Job } from './job'
import { JobStopProps } from './job-stop.props'

export abstract class JobStop extends ElementShadow {
  protected readonly abstract type?: Array<new (...args: any[]) => Job> | (new (...args: any[]) => Job)

  constructor(props?: JobStopProps) {
    super()
    Object.assign(this, props)
    this.$$ignoreEvalProps.push('type')
  }

  async exec() {
    if (!this.type?.length) return
    const stopType = Array.isArray(this.type) ? this.type : [this.type]
    const job: Job = this.getParentByClassName(...stopType)
    await job?.stop()
  }
}
