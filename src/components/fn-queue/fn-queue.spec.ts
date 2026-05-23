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
    concurrent: 1,
    queueData: {
      key1: 'value 1'
    }
  }, {
    runs: [
      {
        js: '$vars.key1 = $ws().queueData.key1'
      }
    ]
  })
  try {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setImmediate(async () => await fn.exec())
    await setTimeout(200)
    expect(Testing.vars.key1 === 'value 1')
  } finally {
    fn.$.remove()
  }
})

test('fn-queue with concurrent > 1', async () => {
  Testing.vars.rs = []
  const fn = await Testing.createElementProxy<FNQueue>(FNQueue, {
    name: 'queue2',
    concurrent: 5,
    startup: false
  }, {
    runs: [
      {
        sleep: 800
      },
      {
        js: '$vars.rs.push($ws().queueData.key1)'
      }
    ]
  })
  try {
    await Promise.race([
      fn.exec(),
      setTimeout(200)
    ])
    fn.$.push({ key1: 'value 1' })
    fn.$.push({ key1: 'value 2' })
    fn.$.push({ key1: 'value 3' })
    fn.$.push({ key1: 'value 4' })
    fn.$.push({ key1: 'value 5' })
    fn.$.push({ key1: 'value 6' })
    fn.$.push({ key1: 'value 7' })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setImmediate(async () => { await fn.$.start() })
    await setTimeout(1000)
    expect(Testing.vars.rs).toHaveLength(5)
  } finally {
    fn.$.remove()
  }
})
