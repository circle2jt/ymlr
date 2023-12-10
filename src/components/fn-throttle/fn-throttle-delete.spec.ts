import { sleep } from 'src/libs/time'
import { ThrottleManager } from 'src/managers/throttle-manager'
import { Testing } from 'src/testing'
import { FNThrottle } from './fn-throttle'
import { FNThrottleDelete } from './fn-throttle-delete'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('delete a fn-throttle', async () => {
  Testing.vars.id = 0
  const fnThrottle = await Testing.createElementProxy(FNThrottle, {
    name: 'ttask1d',
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
    await sleep(200)
    const fnThrottleDelete = await Testing.createElementProxy(FNThrottleDelete, 'ttask1d')
    await fnThrottleDelete.exec()
    await fnThrottleDelete.dispose()

    await sleep(1000)

    expect(Testing.vars.id).toBe(1)
    expect(ThrottleManager.Instance.has('ttask1d')).toBeFalsy()
  } finally {
    await fnThrottle.dispose()
  }
})
