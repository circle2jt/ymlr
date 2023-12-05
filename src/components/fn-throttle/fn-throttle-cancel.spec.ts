import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNThrottle } from './fn-throttle'
import { FNThrottleCancel } from './fn-throttle-cancel'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('cancel a fn-throttle', async () => {
  Testing.vars.i = 0
  const fnThrottle = await Testing.createElementProxy(FNThrottle, {
    name: 'ttaskc1',
    leading: true,
    trailing: true,
    wait: 1000
  }, {
    runs: [
      {
        js: '$vars.i++'
      }
    ]
  })
  try {
    await fnThrottle.exec()
    await fnThrottle.exec()
    await sleep(200)
    const fnThrottleCancel = await Testing.createElementProxy(FNThrottleCancel, 'ttaskc1')
    await fnThrottleCancel.exec()
    await fnThrottleCancel.dispose()

    await sleep(1000)

    expect(Testing.vars.i).toBe(1)
  } finally {
    await fnThrottle.dispose()
  }
})
