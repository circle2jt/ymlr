import { ElementProps } from 'src/components/element.props'

export type PubProps = {
  address: string
  data?: any
  secure?: {
    basic?: string
  } | string
} & ElementProps
