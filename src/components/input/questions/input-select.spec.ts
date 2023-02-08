import { InputSelect } from './input-select'

test('user input select with default value', async () => {
  const input = new InputSelect({
    label: 'Select 1 ?',
    default: 2,
    choices: [
      { title: '1', value: 1 },
      { title: '2', value: 2 }
    ]
  })
  setImmediate(() => input.answer(''))
  const value = await input.exec()
  expect(value).toBe(2)
})
