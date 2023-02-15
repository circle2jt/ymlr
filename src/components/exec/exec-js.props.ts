import { VarsProps } from '../vars/vars.props'

export type ExecJsProps = {
  script?: string
  path?: string
  vars?: VarsProps
} | string
