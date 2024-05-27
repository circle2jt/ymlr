import { Url } from './url'

const encodeedStr = 'test%20encode%20url'
const decodeedStr = 'test encode url'

test('encode', () => {
  const url = new Url()
  const rs = url.encode(decodeedStr)
  expect(rs).toBe(encodeedStr)
})

test('decrypt', () => {
  const url = new Url()
  const rs = url.decode(encodeedStr)
  expect(rs).toBe(decodeedStr)
})
