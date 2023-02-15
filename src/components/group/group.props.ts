import { ElementProps } from '../element.props'

export type GroupProps = {
  description?: string
  runs?: GroupItemProps[]
} & ElementProps

export type GroupItemProps = ElementProps
