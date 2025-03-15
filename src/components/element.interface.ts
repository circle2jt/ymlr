import { type ElementProxy } from './element-proxy'
import { type Group } from './group/group'
import { type GroupItemProps, type GroupProps } from './group/group.props'

export interface Element {
  hideName?: boolean
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>
  readonly innerRunsProxy?: ElementProxy<Group<GroupProps, GroupItemProps>>

  asyncConstructor?: (props?: any) => void | Promise<void>
  preExec?: () => boolean | Promise<boolean>
  exec: (args?: any) => any
  dispose: () => void | Promise<void>
}

export const ElementBaseKeys = new Set(['->', '<-', 'id', 'runs', 'template', 'if', 'elseif', 'else', 'failure', 'debug', 'vars', 'async', 'detach', 'loop', 'name', 'icon', 'skip', 'context', 'skipNext', 'errorStack'])
export type ElementBaseProps = Pick<ElementProxy<Element>, 'id' | 'if' | 'elseif' | 'failure' | 'debug' | 'vars' | 'async' | 'detach' | 'loop' | 'name' | 'icon' | 'skip' | 'context' | 'skipNext' | 'runs' | 'errorStack' | '_curDir'>
export type ElementClass = new (props?: any) => Element
