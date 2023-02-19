import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'

export interface GroupProps {
  description?: string
  runs?: GroupItemProps[]
}

export type GroupItemProps = ElementProxy<Element>
