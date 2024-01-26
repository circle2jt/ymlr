import { Testing } from 'src/testing'
import { setTimeout } from 'timers/promises'
import { FNQueue } from './fn-queue'
import { FNQueueDelete } from './fn-queue-delete'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-queue\'del should be run correctly', async () => {
  const q = await Testing.createElementProxy<FNQueue>(FNQueue, {
    name: 'queue1'
  })
  const fn = await Testing.createElementProxy<FNQueueDelete>(FNQueueDelete, {
    name: 'queue1'
  })
  try {
    await Promise.race([
      q.exec(),
      setTimeout(300).then(async () => {
        expect(FNQueue.Caches.size).toBe(1)
        await fn.exec()
        expect(FNQueue.Caches.size).toBe(0)
      })
    ])
  } finally {
    await fn.dispose()
    await q.dispose()
  }
})
