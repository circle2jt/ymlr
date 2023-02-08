import { GetProps } from './get.props'
import { RequestType } from './types'

export type PostProps = GetProps & {
  type?: RequestType
  body?: any
}
