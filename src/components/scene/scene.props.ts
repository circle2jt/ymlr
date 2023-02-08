import { GroupProps } from '../group/group.props'

export type SceneProps = {
  path?: string
  content?: string
  items?: Element[]
  decryptedPassword?: string
} & GroupProps
