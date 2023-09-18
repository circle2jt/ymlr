import { type HeadProps } from './head.props'

export type GetProps = HeadProps & {
  responseType?: ResponseType
  saveTo?: string
}
