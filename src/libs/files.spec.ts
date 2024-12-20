import { Testing } from 'src/testing'
import { File } from './file'

beforeEach(async () => {
  await Testing.reset()
})

test('toJSON()', () => {
  const p = 'abc.txt'
  const f = new File(p, Testing.rootScene.proxy)
  expect(f.toJSON()).toBe(`file://${p}`)
})
