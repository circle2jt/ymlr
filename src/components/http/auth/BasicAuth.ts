import { Base64 } from 'src/libs/encrypt/base64'
import { type IVerify } from './IVerify'

export class BasicAuth implements IVerify {
  hash: string

  constructor(username: string, password = '') {
    this.hash = 'Basic ' + new Base64().encrypt(`${username}:${password}`)
  }

  verify(userToken: string | undefined) {
    return this.hash === userToken
  }
}
