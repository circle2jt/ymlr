import { ElementProps } from '../element.props'

export type FileReadProps = {
  path: string
  vars: any
  format?: 'json' | 'yaml'
} & ElementProps
