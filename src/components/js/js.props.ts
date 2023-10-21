import { type VarsProps } from '../vars.props'

export type JsProps = {
  script?: string
  path?: string
  vars?: VarsProps
} | string
