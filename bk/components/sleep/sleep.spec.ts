import { Testing } from 'src/testing'
import { Sleep } from './sleep'

let sleep: Sleep

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await sleep.dispose()
})

test('Should sleep for a time', async () => {
  const start = Date.now()
  sleep = await Testing.newElement(Sleep, 500)
  await sleep.exec()
  expect(Date.now() - start).toBeGreaterThanOrEqual(500)
  expect(sleep.result).toBe(500)
})
