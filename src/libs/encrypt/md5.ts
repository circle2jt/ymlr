import { createHash } from 'crypto'
import { type Encrypt } from './encrypt.interface'

export class MD5 implements Encrypt {
  encrypt(data: any) {
    return createHash('md5').update(data).digest('hex')
  }

  decrypt(_data: any) {
    throw new Error('Could not decode md5')
  }
}
