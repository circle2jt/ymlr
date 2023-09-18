import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Clear } from './clear'

let clear: ElementProxy<Clear>

beforeEach(async () => {
  await Testing.reset()
  clear = await Testing.createElementProxy(Clear)
})

afterEach(async () => {
  await clear.dispose()
})

test('clearScreen() should be called', async () => {
  console.clear = jest.fn()
  await clear.exec()
  expect(console.clear).toBeCalled()
})
