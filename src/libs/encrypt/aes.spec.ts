import { AES } from './aes'

const encrypt = 'd0978ec23fae64d7072a0f857ded73a9:d6adcc93af9e00a292715e61b106b655'
const decrypt = 'thanh'

test('encrypt', () => {
  const aes = new AES()
  const rs = aes.encrypt('thanh', 'salt')
  expect(rs.length).toBe(encrypt.length)
})

test('decrypt', () => {
  const aes = new AES()
  const rs = aes.decrypt(encrypt, 'salt')
  expect(rs).toBe(decrypt)
})
