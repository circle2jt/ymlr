import { ElementProps } from '../element.props'

export type FileWriteProps = {
  path: string
  content: any
  format?: 'json' | 'yaml'
  pretty?: boolean
} & ElementProps
