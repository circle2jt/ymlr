import { Testing } from 'src/testing'
import { Clear } from './clear'

let clear: Clear

beforeEach(async () => {
  await Testing.reset()
  clear = await Testing.newElement(Clear)
})

afterEach(async () => {
  await clear.dispose()
})

test('clearScreen() should be called', async () => {
  console.clear = jest.fn()
  await clear.exec()
  expect(console.clear).toBeCalled()
})
