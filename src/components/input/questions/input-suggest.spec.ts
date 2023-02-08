import { InputSuggest } from './input-suggest'

test('user input suggest with default value', async () => {
  const input = new InputSuggest({
    label: 'Suggest 1 ?',
    default: 'NAME 2',
    choices: [
      { title: 'name 1', value: 'NAME 1' },
      { title: 'name 2', value: 'NAME 2' },
      { title: 'name 3', value: 'NAME 3' }
    ]
  })
  setImmediate(() => input.answer('NAME 2'))
  const value = await input.exec()
  expect(value).toBe('NAME 2')
})
