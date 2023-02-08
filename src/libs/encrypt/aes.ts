import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { Encrypt } from './encrypt.interface'

export class AES implements Encrypt {
  private readonly salt: Buffer

  constructor(salt = '') {
    this.salt = Buffer.from(salt)
  }

  encrypt(text: string, _salt?: string) {
    const salt = _salt ? Buffer.from(_salt) : this.salt
    const hash = createHash('sha1')
    hash.update(salt)
    const key = new Uint8Array(hash.digest()).slice(0, 16)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-128-cbc', key, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  decrypt(text: string, _salt?: string) {
    const salt = _salt ? Buffer.from(_salt) : this.salt
    const hash = createHash('sha1')
    hash.update(salt)
    const key = new Uint8Array(hash.digest()).slice(0, 16)
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift() as string, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = createDecipheriv('aes-128-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])
    return decrypted.toString()
  }
}
