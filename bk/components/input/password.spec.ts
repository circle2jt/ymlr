import { Testing } from 'src/testing'
import { Password } from './password'

let input: Password

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input password data', async () => {
  input = await Testing.newElement(Password, {
    title: 'Enter your password ?',
    default: 'abc'
  })

  setImmediate(() => input.answer())
  const rs1 = await input.exec()
  expect(rs1).toBe('abc')

  setImmediate(() => input.answer('def'))
  const rs2 = await input.exec()
  expect(rs2).toBe('def')
})
