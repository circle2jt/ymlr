import { type GroupItemProps, type GroupProps } from 'src/components/group/group.props'
import { type QuitItemProps } from './quit-item.props'
import { type SubItemProps } from './sub-item.props'

export type SubProps = {
  address: string
  type?: 'xml' | 'json' | 'any'
  secure?: {
    basic?: {
      username: string
      password: string
    }
  }
  queue?: {
    file?: string
    password?: string
    storage?: string
  }
  runs: Array<GroupItemProps | SubItemProps | QuitItemProps>
} & GroupProps
