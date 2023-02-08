import { Testing } from 'src/testing'
import { Number } from './number'

let input: Number

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input number data', async () => {
  input = await Testing.newElement(Number, {
    title: 'How old are you ?',
    default: 1
  })

  setImmediate(() => input.answer())
  const rs1 = await input.exec()
  expect(rs1).toBe(1)

  setImmediate(() => input.answer(3))
  const rs2 = await input.exec()
  expect(rs2).toBe(3)
})
