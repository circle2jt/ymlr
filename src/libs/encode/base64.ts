import { type Encode } from './encode.interface'

export class Base64 implements Encode {
  encode(data: any) {
    return Buffer.from(data).toString('base64')
  }

  decode(data: any) {
    return Buffer.from(data.toString(), 'base64').toString()
  }
}
