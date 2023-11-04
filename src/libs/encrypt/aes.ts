import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { type Encrypt } from './encrypt.interface'

export class AES implements Encrypt {
  private readonly salt: Buffer

  constructor(salt = '') {
    this.salt = Buffer.from(salt)
  }

  encrypt(text: string, saltStr?: string) {
    const salt = saltStr ? Buffer.from(saltStr) : this.salt
    const key = new Uint8Array(createHash('sha1').update(salt).digest()).slice(0, 16)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-128-cbc', key, iv)
    const encrypted = Buffer.concat([iv, cipher.update(text), cipher.final()])
    return encrypted.toString('base64')
  }

  decrypt(buf: string, saltStr?: string) {
    const salt = saltStr ? Buffer.from(saltStr) : this.salt
    let bufContent: Buffer = Buffer.from(buf, 'base64')
    const iv = bufContent.subarray(0, 16)
    bufContent = bufContent.subarray(16)
    const key = new Uint8Array(createHash('sha1').update(salt).digest()).slice(0, 16)
    const decipher = createDecipheriv('aes-128-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(bufContent), decipher.final()])
    return decrypted.toString()
  }
}
