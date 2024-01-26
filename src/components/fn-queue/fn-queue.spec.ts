import { Testing } from 'src/testing'
import { setTimeout } from 'timers/promises'
import { FNQueue } from './fn-queue'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-queue should be run correctly', async () => {
  Testing.vars.i = 0
  const fn = await Testing.createElementProxy<FNQueue>(FNQueue, {
    name: 'queue1',
    db: null,
    concurrent: 1
  }, {
    runs: [
      {
        js: '$vars.key1 = $parentState.queueData.key1'
      }
    ]
  })
  try {
    await Promise.race<any>([
      fn.exec(),
      setTimeout(200)
    ])
    fn.$.push({ key1: 'value 1' })
    await setTimeout(200)
    expect(Testing.vars.key1 === 'value 1')
  } finally {
    await fn.dispose()
  }
})

test('fn-queue with concurrent > 1', async () => {
  Testing.vars.rs = []
  const fn = await Testing.createElementProxy<FNQueue>(FNQueue, {
    name: 'queue1',
    concurrent: 5
  }, {
    runs: [
      {
        sleep: 800
      },
      {
        js: '$vars.rs.push($parentState.queueData.key1)'
      }
    ]
  })
  try {
    await Promise.race([
      fn.exec(),
      setTimeout(200)
    ])
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 1' })
    await setTimeout(1000)
    expect(Testing.vars.rs).toHaveLength(5)
  } finally {
    await fn.dispose()
  }
})
