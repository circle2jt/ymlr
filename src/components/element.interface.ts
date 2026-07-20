import { type ElementProxy } from './element-proxy'
import { type Group } from './group/group'
import { type GroupItemProps, type GroupProps } from './group/group.props'

export interface Element {
  hideName?: boolean
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>
  readonly innerRunsProxy?: ElementProxy<Group<GroupProps, GroupItemProps>>
  overrideProxyProps?: () => any
  asyncConstructor?: (props?: any) => void | Promise<void>
  preExec?(): boolean | Promise<boolean>
  exec(parentState?: any): any
  dispose(): void | Promise<void>
}

export const ElementBaseKeys = new Set(['->', '<-', 'id', 'runs', 'template', 'props', 'placeholder', 'cached', 'case', 'if', 'elseif', 'else', 'failure', 'debug', 'vars', 'async', 'detach', 'loop', 'name', 'icon', 'skip', 'context', 'skipNext', 'errorStack', 'catch', 'finally'])
export type ElementBaseProps = Pick<ElementProxy<Element>, 'id' | 'case' | 'if' | 'elseif' | 'failure' | 'debug' | 'vars' | 'async' | 'detach' | 'loop' | 'name' | 'icon' | 'skip' | 'context' | 'skipNext' | 'runs' | 'errorStack' | '_curDir' | 'placeholder' | 'cached' | 'catch' | 'finally'>
export type ElementClass = new (props?: any) => Element
