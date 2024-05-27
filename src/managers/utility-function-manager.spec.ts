import { AES } from 'src/libs/encrypt/aes'
import { MD5 } from 'src/libs/encrypt/md5'
import { sleep } from 'src/libs/time'
import { UtilityFunctionManager } from './utility-function-manager'

const globalUtils = UtilityFunctionManager.Instance

test('throttle manager is existed', () => {
  expect(globalUtils.throttleManager).toBeDefined()
})

test('debounce manager is existed', () => {
  expect(globalUtils.debounceManager).toBeDefined()
})

test('base64 encode/decode', async () => {
  const encodedStr = 'dGhhbmg='
  const decodedStr = 'thanh'
  expect(globalUtils.base64.encode(decodedStr)).toBe(encodedStr)
  expect(globalUtils.base64.decode(encodedStr)).toBe(decodedStr)
})

test('url encode/decode', async () => {
  const encodeedStr = 'test%20encode%20url'
  const decodeedStr = 'test encode url'
  expect(globalUtils.url.encode(decodeedStr)).toBe(encodeedStr)
  expect(globalUtils.url.decode(encodeedStr)).toBe(decodeedStr)
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

test('emit/on in global event', async () => {
  let name = ''
  globalUtils.globalEvent.on('say', user => {
    name = user
  })
  await sleep(500)
  globalUtils.globalEvent.emit('say', 'thanh')
  await sleep(500)
  expect(name).toBe('thanh')
})
