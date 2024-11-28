import { sleep, toDate } from './time'

test('sleep()', async () => {
  const begin = Date.now()
  await sleep('1s')
  const dur = Date.now() - begin
  expect(dur).toBeGreaterThanOrEqual(1000)
})

test.each([
  ['9 11 2024 33 22 11 444', 'DD MM YYYY ss mm hh ms', new Date(2024, 10, 9, 11, 22, 33, 444)],
  ['2024-11-09 11:22:33-444', 'YYYY-MM-DD hh:mm:ss-ms', new Date(2024, 10, 9, 11, 22, 33, 444)],
  ['11/9/2024 22:33:11.444', 'MM/DD/YYYY mm:ss:hh.ms', new Date(2024, 10, 9, 11, 22, 33, 444)]
])('toDate() %s to %j', (dateString: string, format: string, expected: Date) => {
  expect(toDate(dateString, format)).toStrictEqual(expected)
})
