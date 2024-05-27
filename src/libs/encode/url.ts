import { escape } from 'querystring'
import { type Encode } from './encode.interface'

export class Url implements Encode {
  encode(str: string) {
    return escape(str)
  }

  decode(str: string) {
    return unescape(str)
  }
}
