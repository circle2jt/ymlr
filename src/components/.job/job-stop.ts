import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { Job } from './job'
import { JobStopProps } from './job-stop.props'

export abstract class JobStop implements Element {
  readonly ignoreEvalProps = ['type']
  readonly proxy!: ElementProxy<this>

  protected readonly abstract type?: Array<new (...args: any[]) => Job> | (new (...args: any[]) => Job)

  constructor(props?: JobStopProps) {
    Object.assign(this, props)
  }

  async exec() {
    if (!this.type?.length) return
    const stopType = Array.isArray(this.type) ? this.type : [this.type]
    const job = this.proxy.getParentByClassName(...stopType)
    await job?.element.stop()
  }

  dispose() { }
}
