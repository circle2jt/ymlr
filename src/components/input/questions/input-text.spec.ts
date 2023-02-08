import { InputText } from './input-text'

test('user input text', async () => {
  const input = new InputText({
    label: 'Enter text here'
  })
  setImmediate(() => input.answer('thanh'))
  const value = await input.exec()
  expect(value).toBe('thanh')
})
