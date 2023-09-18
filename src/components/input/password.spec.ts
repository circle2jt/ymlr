import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Password } from './password'

let input: ElementProxy<Password>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input password data', async () => {
  input = await Testing.createElementProxy(Password, {
    title: 'Enter your password ?',
    default: 'abc'
  })

  setImmediate(() => input.element.answer())
  const rs1 = await input.exec()
  expect(rs1).toBe('abc')

  setImmediate(() => input.element.answer('def'))
  const rs2 = await input.exec()
  expect(rs2).toBe('def')
})
