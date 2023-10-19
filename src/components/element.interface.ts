import { type ElementProxy } from './element-proxy'
import type Group from './group'
import { type GroupItemProps, type GroupProps } from './group/group.props'

export interface Element {
  readonly hideName?: boolean
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>
  readonly innerRunsProxy?: ElementProxy<Group<GroupProps, GroupItemProps>>

  asyncConstructor?: (props?: any) => any
  exec: (input?: any) => any
  dispose: () => any

}

export const ElementBaseKeys = ['->', '<-', 'id', 'template', 'if', 'elseif', 'else', 'force', 'debug', 'vars', 'async', 'detach', 'loop', 'name', 'skip', 'context', 'skipNext']
export type ElementBaseProps = Pick<ElementProxy<Element>, 'id' | 'if' | 'elseif' | 'force' | 'debug' | 'vars' | 'async' | 'detach' | 'loop' | 'name' | 'skip' | 'context' | 'skipNext'>
export type ElementClass = new (props?: any) => Element
