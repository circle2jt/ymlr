import { GroupProps } from '../group/group.props'
import { VarsProps } from '../vars/vars.props'

export type SceneProps = {
  path?: string
  content?: string
  items?: Element[]
  decryptedPassword?: string
  encryptedPath?: string
  password?: string
  vars?: VarsProps
} & GroupProps
