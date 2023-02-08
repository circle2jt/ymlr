import { Testing } from 'src/testing'
import { File } from './file'

test('toJSON()', () => {
  const p = 'abc.txt'
  const f = new File(p, Testing.rootScene)
  expect(f.toJSON()).toBe(`file://${p}`)
})
