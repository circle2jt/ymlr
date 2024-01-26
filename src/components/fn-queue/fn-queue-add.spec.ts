import { Testing } from 'src/testing'
import { setTimeout } from 'timers/promises'
import { FNQueue } from './fn-queue'
import { FNQueueAdd } from './fn-queue-add'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-queue\'add should be run correctly', async () => {
  Testing.vars.rs = undefined
  const q = await Testing.createElementProxy<FNQueue>(FNQueue, {
    name: 'queue1'
  }, {
    runs: [{
      js: '$vars.rs = $parentState.queueData.key1'
    }]
  })
  const fn = await Testing.createElementProxy<FNQueueAdd>(FNQueueAdd, {
    name: 'queue1',
    data: {
      key1: 'value 1'
    }
  })
  try {
    await Promise.race([
      q.exec(),
      setTimeout(300).then(async () => await fn.exec())
    ])
    await setTimeout(300)
    expect(Testing.vars.rs).toBe('value 1')
  } finally {
    await fn.dispose()
    await q.dispose()
  }
})
