import { type VarsProps } from '../vars/vars.props'

export type JsProps = {
  script?: string
  path?: string
  vars?: VarsProps
} | string
