import { ElementProps } from '../element.props'

export type EchoProps = ({
  style?: string
  pretty?: boolean
  content?: any
} & ElementProps) | string
