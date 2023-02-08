import { ElementProps } from '../element.props'

export type HeadProps = {
  baseURL?: string
  timeout?: number | string
  url: string
  headers?: any
  query?: any
} & ElementProps
