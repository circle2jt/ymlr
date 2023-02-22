import { GroupProps } from '../group/group.props'

export type SceneProps = {
  path?: string
  content?: string
  items?: Element[]
  process?: boolean | string
  decryptedPassword?: string
  encryptedPath?: string
  password?: string
  vars?: Record<string, any>
} & GroupProps
