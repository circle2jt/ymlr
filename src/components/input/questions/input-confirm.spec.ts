import { InputConfirm } from './input-confirm'

test('user input confirm true', async () => {
  const input = new InputConfirm({
    label: 'Confirm here ?'
  })
  setImmediate(() => input.answer('y'))
  const value = await input.exec()
  expect(value).toBe(true)
})

test('user input confirm false', async () => {
  const input = new InputConfirm({
    label: 'Confirm here ?'
  })
  setImmediate(() => input.answer('n'))
  const value = await input.exec()
  expect(value).toBe(false)
})
