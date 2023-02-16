import { Testing } from 'src/testing'
import { Select } from './select'

let input: Select

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input select data', async () => {
  input = await Testing.newElement(Select, {
    title: 'Pick 1 ?',
    default: 2,
    choices: [
      { title: 'A1', value: 1 },
      { title: 'A2', value: 2 },
      { title: 'A3', value: 3 }
    ]
  })

  setImmediate(() => input.answer())
  const rs2 = await input.exec()
  expect(rs2).toBe(2)
})
