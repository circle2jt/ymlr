import { type VarsProps } from '../vars.props'

export type ShProps = {
  bin?: string
  script?: string
  path?: string
  vars?: VarsProps
  timeout?: string | number
  process?: boolean
} | string
