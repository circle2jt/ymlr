import { ElementProxy } from './element-proxy'

export interface Element {
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>

  asyncConstructor?: (props?: any) => any
  exec: (input?: any) => any
  dispose: () => any

}

export const ElementBaseKeys = ['->', '<-', 'template', 'if', 'force', 'debug', 'vars', 'async', 'loop', 'name', 'skip']
export type ElementBaseProps = Pick<ElementProxy<Element>, 'if' | 'force' | 'debug' | 'vars' | 'async' | 'loop' | 'name' | 'skip'>
export type ElementClass = new (props?: any) => Element
