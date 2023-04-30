import { formatDuration, formatFileName, formatFixLengthNumber, formatNumber, formatTextToMs, kebabToCamelCase, tryToParseObject } from './format'

test('kebabToCamelCase', () => {
  expect(kebabToCamelCase('test-name')).toBe('testName')
  expect(kebabToCamelCase('test-id-123')).toBe('testId123')
})

test('format number', () => {
  expect(formatNumber(1000999)).toBe('1,000,999')
})

test.each([
  [13, '13ms'],
  [1000 + 13, '1s 13ms'],
  [(15 * (60 * 1000)) + (5 * 1000) + 13, '15m 5s 13ms'],
  [(4 * 60 * (60 * 1000)) + (15 * (60 * 1000)) + (5 * 1000) + 13, '4h 15m 5s 13ms']
])('format duration %d to %s', (num: number, str: string) => {
  expect(formatDuration(num)).toBe(str)
})

test.each([
  ['2000', 2000],
  ['200ms', 200],
  ['2s', (2 * 1000)],
  ['1m', (60 * 1000)],
  ['1m 2s', (60 * 1000) + (2 * 1000)],
  ['1h 1m', (60 * 60 * 1000) + (60 * 1000)],
  ['1h 1m2s', (60 * 60 * 1000) + (60 * 1000) + (2 * 1000)],
  ['1d', 24 * 60 * 60 * 1000],
  ['1d 1h1m2s', (24 * 60 * 60 * 1000) + (60 * 60 * 1000) + (60 * 1000) + (2 * 1000)]
])('format to text %s to %dms', (formula, expected) => {
  expect(formatTextToMs(formula)).toBe(expected)
})

test.each([
  { title: 'boolean', input: true, output: true },
  { title: 'boolean', input: false, output: false },
  { title: 'string', input: 'test', output: 'test' },
  { title: 'object', input: { name: 'user 1', address: { city: 'hn' }, hobbies: ['running', 'travel'] }, output: { name: 'user 1', address: { city: 'hn' }, hobbies: ['running', 'travel'] } },
  { title: 'number', input: 1, output: 1 },
  { title: 'array', input: [1, 2, 4], output: [1, 2, 4] },
  { title: 'null', input: null, output: null },
  { title: 'undefined', input: undefined, output: undefined }
])('try to parse "$title" to "object"', ({ input, output }) => {
  expect(tryToParseObject(input)).toEqual(output)
})

test.each([
  { title: 'Unicode string', input: 'unicode đoàn thuận  thành', output: 'unicode doan thuan thanh' },
  { title: 'Special characters', input: 'author (thanh)', output: 'author thanh' },
  { title: 'Multiple spaces', input: 'author  - (!@#thanh)', output: 'author - thanh' },
  { title: 'File with a extension', input: 'author  - (!@#thanh).mp3', output: 'author - thanh.mp3' }
])('format file name $title', ({ input, output }) => {
  expect(formatFileName(input)).toEqual(output)
})

test.each([
  { input: 3, length: 2, output: '03' },
  { input: 3, length: 3, output: '003' },
  { input: 33, length: 3, output: '033' }
])('format numver with fix length is $length', ({ input, length, output }) => {
  expect(formatFixLengthNumber(input, length)).toEqual(output)
})
