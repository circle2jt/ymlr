export interface StorageInterface {
  load: (defaultData: any) => any
  save: (data: any) => any
  clean: () => any
}
