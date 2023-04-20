import { VarsProps } from '../vars/vars.props'

export type ShProps = {
  bin?: string
  script?: string
  path?: string
  vars?: VarsProps
  timeout?: string | number
  process?: boolean
} | string
