import { MD5 } from './md5'

const encrypt = '8478e2bdb758f8467225ae87ed3750c2'

test('encrypt', () => {
  const md5 = new MD5()
  const rs = md5.encrypt('thanh')
  expect(rs).toBe(encrypt)
})

test('decrypt', () => {
  const md5 = new MD5()
  expect(() => { md5.decrypt(encrypt) }).toThrowError(new Error('Could not decode md5'))
})
