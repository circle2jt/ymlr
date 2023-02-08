import { Testing } from 'src/testing'
import { Confirm } from './confirm'

let input: Confirm

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input confirm data', async () => {
  input = await Testing.newElement(Confirm, {
    title: 'Are you sure ?',
    default: false
  })
  setImmediate(() => input.answer('n'))
  const rs1 = await input.exec()
  expect(rs1).toBe(false)

  setImmediate(() => input.answer('y'))
  const rs2 = await input.exec()
  expect(rs2).toBe(true)
})
