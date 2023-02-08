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
})

test('Should sleep for a time and show title', async () => {
  const start = Date.now()
  sleep = await Testing.newElement(Sleep, {
    title: 'sleep 500ms',
    duration: 500
  })
  await sleep.exec()
  expect(Date.now() - start).toBeGreaterThanOrEqual(500)
  expect(sleep.title).toBe('sleep 500ms')
})
