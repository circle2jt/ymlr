
export interface Element {
  // new(props?: any): any
  asyncConstructor?: (props?: any) => void | Promise<void>
  exec: () => any
  dispose: () => any
}
