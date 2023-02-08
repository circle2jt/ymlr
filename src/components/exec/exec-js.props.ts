import { VarsProps } from '../vars/vars.props'

export type ExecJsProps = {
  title?: string
  script?: string
  path?: string
  vars?: VarsProps
} | string
