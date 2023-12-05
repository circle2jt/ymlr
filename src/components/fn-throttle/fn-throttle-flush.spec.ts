import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNThrottle } from './fn-throttle'
import { FNThrottleFlush } from './fn-throttle-flush'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('flush a fn-throttle', async () => {
  Testing.vars.id = 0
  const fnThrottle = await Testing.createElementProxy(FNThrottle, {
    name: 'ttask1f',
    leading: true,
    trailing: true,
    wait: 1000
  }, {
    runs: [
      {
        js: '$vars.id++'
      }
    ]
  })
  try {
    await fnThrottle.exec()
    await fnThrottle.exec()
    const fnThrottleFlush = await Testing.createElementProxy(FNThrottleFlush, 'ttask1f')
    await fnThrottleFlush.exec()
    await fnThrottleFlush.dispose()

    await sleep(200)

    expect(Testing.vars.id).toBe(2)
  } finally {
    await fnThrottle.dispose()
  }
})
