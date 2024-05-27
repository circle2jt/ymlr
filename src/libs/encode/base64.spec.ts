import { Base64 } from './base64'

const encodedStr = 'dGhhbmg='
const decodedStr = 'thanh'

test('encode', () => {
  const base64 = new Base64()
  const rs = base64.encode(decodedStr)
  expect(rs).toBe(encodedStr)
})

test('decode', () => {
  const base64 = new Base64()
  const rs = base64.decode(encodedStr)
  expect(rs).toBe(decodedStr)
})
