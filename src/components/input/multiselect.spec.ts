import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { MultiSelect } from './multiselect'

let input: ElementProxy<MultiSelect>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input multiselect data', async () => {
  input = await Testing.createElementProxy(MultiSelect, {
    title: 'Pick some ?',
    default: [1, 3],
    choices: [
      { title: 'A1', value: 1 },
      { title: 'A2', value: 2 },
      { title: 'A3', value: 3 }
    ]
  })

  setImmediate(() => input.element.answer())
  const rs2 = await input.exec()
  expect(rs2).toEqual([1, 3])
})
