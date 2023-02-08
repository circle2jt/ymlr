import { Base64 } from './base64'

const encrypt = 'dGhhbmg='
const decrypt = 'thanh'

test('encrypt', () => {
  const base64 = new Base64()
  const rs = base64.encrypt('thanh')
  expect(rs).toBe(encrypt)
})

test('decrypt', () => {
  const base64 = new Base64()
  const rs = base64.decrypt(encrypt)
  expect(rs).toBe(decrypt)
})
