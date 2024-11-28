import { type GroupProps } from '../group/group.props'
import { type VarsProps } from '../vars.props'

export type SceneProps = {
  path?: string
  content?: string
  varsFile?: string | string[]
  decryptedPassword?: string
  password?: string
  vars?: VarsProps
} & GroupProps
