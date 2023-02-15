import { VarsProps } from '../vars/vars.props'

export type ExecShProps = {
  bin?: string
  script?: string
  path?: string
  vars?: VarsProps
} | string
