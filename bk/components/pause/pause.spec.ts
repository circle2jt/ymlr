/* eslint-disable @typescript-eslint/no-misused-promises */
import { Testing } from 'src/testing'
import { Pause } from './pause'

let pause: Pause

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await pause.dispose()
})

test('Should pause infinity', async () => {
  const start = Date.now()
  pause = await Testing.newElement(Pause)
  setTimeout(async () => {
    await pause.continue()
  }, 600)
  await pause.exec()
  expect(Date.now() - start).toBeGreaterThanOrEqual(500)
})
