export interface StorageInterface<T = any> {
  // new(logger: Logger, config?: any): any

  load: <T>(defaultData: any) => T
  save: (data: T) => any
  clean: () => any
}
