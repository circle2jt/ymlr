import { type GetProps } from './get.props'
import { type RequestType } from './types'

export type PostProps = GetProps & {
  type?: RequestType
  body?: any
}
