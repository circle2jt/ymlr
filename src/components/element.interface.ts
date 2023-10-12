import { type ElementProxy } from './element-proxy'

export interface Element {
  readonly hideName?: boolean
  readonly ignoreEvalProps?: string[]
  readonly proxy: ElementProxy<this>

  asyncConstructor?: (props?: any) => any
  exec: (input?: any) => any
  dispose: () => any

}

export const ElementBaseKeys = ['->', '<-', 'id', 'template', 'if', 'elseif', 'else', 'force', 'debug', 'vars', 'async', 'detach', 'loop', 'name', 'skip', 'context', 'skipNext']
export type ElementBaseProps = Pick<ElementProxy<Element>, 'id' | 'if' | 'elseif' | 'force' | 'debug' | 'vars' | 'async' | 'detach' | 'loop' | 'name' | 'skip' | 'context' | 'skipNext'>
export type ElementClass = new (props?: any) => Element
