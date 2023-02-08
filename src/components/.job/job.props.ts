import { GroupItemProps, GroupProps } from 'src/components/group/group.props'
import { JobStopProps } from './job-stop.props'

export type JobProps = {
  queue?: {
    file?: string
    password?: string
    storage?: string
  }
  runs: Array<GroupItemProps | JobStopProps>
} & GroupProps
