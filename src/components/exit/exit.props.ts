import { ElementProps } from 'src/components/element.props'

export type ExitProps = ({
  code?: string | number
} & ElementProps) | null | undefined | string | number
