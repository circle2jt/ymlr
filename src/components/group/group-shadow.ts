import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

export class GroupShadow implements Element {
  ignoreEvalProps = ['owner']
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  public owner!: Element

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec(parentState?: any) {
    return await this.innerRunsProxy.exec(parentState)
  }

  async dispose() {
    await this.innerRunsProxy.dispose()
  }
}
