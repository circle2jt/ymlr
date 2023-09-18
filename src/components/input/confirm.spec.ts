import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Confirm } from './confirm'

let input: ElementProxy<Confirm>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input confirm data', async () => {
  input = await Testing.createElementProxy(Confirm, {
    title: 'Are you sure ?',
    default: false
  })
  setImmediate(() => input.element.answer('n'))
  const rs1 = await input.exec()
  expect(rs1).toBe(false)

  setImmediate(() => input.element.answer('y'))
  const rs2 = await input.exec()
  expect(rs2).toBe(true)
})
