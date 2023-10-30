import { Base64 } from 'src/libs/encrypt/base64'
import { type IVerify } from './IVerify'

export class BasicAuth implements IVerify {
  private readonly hash: string

  constructor(username: string, password = '') {
    this.hash = 'Basic ' + new Base64().encrypt(`${username}:${password}`)
  }

  verify(parentState: Record<string, any>) {
    const userToken = parentState.headers.authorization || parentState.query.authorization
    return this.hash === userToken
  }
}
