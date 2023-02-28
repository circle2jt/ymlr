import { AES } from './aes'

const txt = 'Hello world'
const password = 'salt-pass'
let encrypt: string

test('encrypt', () => {
  const aes = new AES()
  encrypt = aes.encrypt(txt, password)
  expect(encrypt.length).toBeGreaterThan(0)
})

test('decrypt', () => {
  const aes = new AES()
  const rs = aes.decrypt(encrypt, password)
  expect(rs).toEqual(txt)
})
