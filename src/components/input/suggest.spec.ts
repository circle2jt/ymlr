import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Suggest } from './suggest'

let input: ElementProxy<Suggest>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input Suggest data', async () => {
  input = await Testing.createElementProxy(Suggest, {
    title: 'Pick 1 ?',
    default: 2,
    suggestType: 'STARTSWITH_AND_ALLOW_NEW',
    choices: [
      { title: 'A1', value: 1 },
      { title: 'A2', value: 2 },
      { title: 'A3', value: 3 }
    ]
  })

  setImmediate(() => input.element.answer())
  const rs2 = await input.exec()
  expect(rs2).toBe(2)
})
