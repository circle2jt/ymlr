import { VarsProps } from '../vars/vars.props'

export type ExecShProps = {
  title?: string
  bin?: string
  script?: string
  path?: string
  vars?: VarsProps
} | string
