import { GroupProps } from '../group/group.props'

export type SceneScope = 'share' | 'local'

export type SceneProps = {
  path?: string
  content?: string
  scope?: SceneScope
  items?: Element[]
  process?: boolean | string
  decryptedPassword?: string
  encryptedPath?: string
  password?: string
  vars?: Record<string, any>
} & GroupProps
