import { type ElementProxy } from './element-proxy'
import { type Group } from './group/group'
import { type GroupItemProps, type GroupProps } from './group/group.props'

export interface Element {
  hideName?: boolean
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>
  readonly innerRunsProxy?: ElementProxy<Group<GroupProps, GroupItemProps>>

  asyncConstructor?: (props?: any) => void | Promise<void>
  preExec?: (input?: any) => boolean | Promise<boolean>
  exec: (input?: any) => any
  dispose: () => void | Promise<void>

  runEachOfElements?: (parentState?: Record<string, any>) => any
}

export const ElementBaseKeys = ['->', '<-', 'id', 'runs', 'template', 'if', 'elseif', 'else', 'failure', 'debug', 'vars', 'async', 'detach', 'loop', 'name', 'icon', 'skip', 'context', 'skipNext', 'errorStack']
export type ElementBaseProps = Pick<ElementProxy<Element>, 'id' | 'if' | 'elseif' | 'failure' | 'debug' | 'vars' | 'async' | 'detach' | 'loop' | 'name' | 'icon' | 'skip' | 'context' | 'skipNext' | 'runs' | 'errorStack'>
export type ElementClass = new (props?: any) => Element
