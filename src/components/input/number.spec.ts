import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Number as NumberInput } from './number'

let input: ElementProxy<NumberInput>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input number data', async () => {
  input = await Testing.createElementProxy(NumberInput, {
    title: 'How old are you ?',
    default: 1
  })

  setImmediate(() => input.element.answer())
  const rs1 = await input.exec()
  expect(rs1).toBe(1)

  setImmediate(() => input.element.answer(3))
  const rs2 = await input.exec()
  expect(rs2).toBe(3)
})
