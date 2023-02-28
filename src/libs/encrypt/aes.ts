import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { Encrypt } from './encrypt.interface'

export class AES implements Encrypt {
  private readonly salt: Buffer

  constructor(salt = '') {
    this.salt = Buffer.from(salt)
  }

  encrypt(text: string, _salt?: string) {
    const salt = _salt ? Buffer.from(_salt) : this.salt
    const key = new Uint8Array(createHash('sha1').update(salt).digest()).slice(0, 16)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-128-cbc', key, iv)
    const encrypted = Buffer.concat([iv, cipher.update(text), cipher.final()])
    return encrypted.toString('base64')
  }

  decrypt(buf: string, _salt?: string) {
    const salt = _salt ? Buffer.from(_salt) : this.salt
    let bufContent: Buffer = Buffer.from(buf, 'base64')
    const iv = bufContent.subarray(0, 16)
    bufContent = bufContent.subarray(16)
    const key = new Uint8Array(createHash('sha1').update(salt).digest()).slice(0, 16)
    const decipher = createDecipheriv('aes-128-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(bufContent), decipher.final()])
    return decrypted.toString()
  }
}
