import { InputNumber } from './input-number'

test('user input number', async () => {
  const input = new InputNumber({
    label: 'Enter number here'
  })
  setImmediate(() => input.answer(10))
  const value = await input.exec()
  expect(value).toBe(10)
})
