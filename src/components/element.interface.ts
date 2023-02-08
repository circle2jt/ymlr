
export interface Element {
  // new(props?: any): any
  asyncConstructor?: (props?: any) => any
  exec: (input?: any) => any
  dispose: () => any
  disposeApp?: () => any
}
