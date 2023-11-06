import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

export interface GroupProps {
  hideName?: boolean
  runs?: GroupItemProps[]
}

export type GroupItemProps = ElementProxy<Element>
