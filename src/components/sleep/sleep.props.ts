import { ElementProps } from 'src/components/element.props'

export type SleepProps = ({
  duration: number
} & ElementProps) | number
