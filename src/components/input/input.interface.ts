export interface InputInterface {
  label?: string
  default?: any
  type?: string
  required?: boolean

  exec: (opts?: any) => any
  answer: (value: string | number | boolean | Array<{ key: string, name: string }>) => any
}
