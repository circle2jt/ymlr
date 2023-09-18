/* eslint-disable @typescript-eslint/no-misused-promises */
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Pause } from './pause'

let pause: ElementProxy<Pause>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await pause.dispose()
})

test('Should pause infinity', async () => {
  const start = Date.now()
  pause = await Testing.createElementProxy(Pause)
  setTimeout(async () => {
    pause.element.continue()
  }, 600)
  await pause.exec()
  expect(Date.now() - start).toBeGreaterThanOrEqual(500)
})
