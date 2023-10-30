import { type IVerify } from './IVerify'

export class CustomAuth implements IVerify {
  [prop: string]: any

  constructor(props: any) {
    Object.assign(this, props)
  }

  verify(_: Record<string, any>) {
    // Auto inject code from user
    return false
  }
}
