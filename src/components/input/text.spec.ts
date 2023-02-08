import { Testing } from 'src/testing'
import { Text } from './text'

let input: Text

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await input.dispose()
})

test('Input text data', async () => {
  input = await Testing.newElement(Text, {
    title: 'What\'s you name ?',
    default: 'noname'
  })

  setImmediate(() => input.answer())
  const rs2 = await input.exec()
  expect(rs2).toBe('noname')

  setImmediate(() => input.answer('thanh'))
  const rs1 = await input.exec()
  expect(rs1).toBe('thanh')
})
