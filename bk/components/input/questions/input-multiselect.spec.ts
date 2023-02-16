import { InputMultiSelect } from './input-multiselect'

test('user input multi select with default value', async () => {
  const input = new InputMultiSelect({
    label: 'Select multiple ?',
    default: 4,
    choices: [
      { title: '1', value: 1 },
      { title: '2', value: 2 },
      { title: '3', value: 3 },
      { title: '4', value: 4 },
      { title: '5', value: 5 }
    ]
  })
  setImmediate(() => input.answer(''))
  const value = await input.exec()
  expect(value).toStrictEqual([4])
})
