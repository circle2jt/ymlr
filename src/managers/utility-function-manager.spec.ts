import { AES } from 'src/libs/encrypt/aes'
import { Base64 } from 'src/libs/encrypt/base64'
import { MD5 } from 'src/libs/encrypt/md5'
import { UtilityFunctionManager } from './utility-function-manager'

const globalUtils = new UtilityFunctionManager()

test('base64 encrypt/decrypt', async () => {
  const raw = 'thanh'
  const enc = new Base64().encrypt(raw)
  expect(globalUtils.base64.encrypt(raw)).toBe(enc)
  expect(globalUtils.base64.decrypt(enc)).toBe(raw)
})

test('md5 encrypt', async () => {
  const raw = 'thanh'
  const enc = new MD5().encrypt(raw)
  expect(globalUtils.md5.encrypt(raw)).toBe(enc)
})

test('aes encrypt/decrypt', async () => {
  const raw = 'thanh'
  const salt = 'my salt'
  const enc = new AES().encrypt(raw, salt)
  expect(globalUtils.aes.encrypt(raw, salt)).not.toBe(enc)
  expect(globalUtils.aes.decrypt(enc, salt)).toBe(raw)
})
