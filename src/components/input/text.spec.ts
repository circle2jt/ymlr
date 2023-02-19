import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Text } from './text'

let input: ElementProxy<Text>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input text data', async () => {
  input = await Testing.createElementProxy(Text, {
    title: 'What\'s you name ?',
    default: 'noname'
  })

  setImmediate(() => input.element.answer())
  const rs2 = await input.exec()
  expect(rs2).toBe('noname')

  setImmediate(() => input.element.answer('thanh'))
  const rs1 = await input.exec()
  expect(rs1).toBe('thanh')
})
