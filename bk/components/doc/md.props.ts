import { ElementProps } from '../element.props'

export type MDDocProps = {
  saveTo: string
  includeDirs: string[]
  includePattern: RegExp
  excludeDirs: string[]
  prependMDs?: Array<string | { path: string }>
  appendMDs?: Array<string | { path: string }>
} & ElementProps
