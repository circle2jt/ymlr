import { Base64 } from 'src/libs/encode/base64'
import { type IVerify } from './IVerify'

export class BasicAuth implements IVerify {
  readonly #hash: string

  constructor(username: string, password = '') {
    this.#hash = 'Basic ' + new Base64().encode(`${username}:${password}`)
  }

  verify(parentState: Record<string, any>) {
    const userToken = parentState.headers.authorization || parentState.query.authorization
    return this.#hash === userToken
  }
}
