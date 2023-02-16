import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'
import { Job } from './job'
import { JobStopProps } from './job-stop.props'

export abstract class JobStop implements Element {
  proxy!: ElementProxy

  protected readonly abstract type?: Array<new (...args: any[]) => Job> | (new (...args: any[]) => Job)

  constructor(props?: JobStopProps) {
    super()
    Object.assign(this, props)
    this.$$ignoreEvalProps.push('type')
  }
  asyncConstructor?: ((props?: any) => any) | undefined
  disposeApp?: (() => any) | undefined

  async exec() {
    if (!this.type?.length) return
    const stopType = Array.isArray(this.type) ? this.type : [this.type]
    const job: Job = this.proxy.getParentByClassName(...stopType)
    await job?.stop()
  }

  dispose() { }
}
