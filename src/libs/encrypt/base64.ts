import { Encrypt } from './encrypt.interface'

export class Base64 implements Encrypt {
  encrypt(data: any) {
    return Buffer.from(data).toString('base64')
  }

  decrypt(data: any) {
    return Buffer.from(data.toString(), 'base64').toString()
  }
}
