import { InputPassword } from './input-password'

test('user input password', async () => {
  const input = new InputPassword({
    label: 'Enter password here'
  })
  setImmediate(() => input.answer('my pass'))
  const value = await input.exec()
  expect(value).toBe('my pass')
})
