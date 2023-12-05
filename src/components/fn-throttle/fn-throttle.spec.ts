import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNThrottle } from './fn-throttle'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-throttle should be run correctly', async () => {
  Testing.vars.i = 0
  for (let i = 0; i < 4; i++) {
    const fnThrottle = await Testing.createElementProxy(FNThrottle, {
      name: 'ttask1',
      leading: true,
      trailing: true,
      wait: 500
    }, {
      runs: [
        {
          js: '$vars.i++'
        }
      ]
    })
    try {
      await fnThrottle.exec()
    } finally {
      await fnThrottle.dispose()
    }
    if (i > 1) {
      await sleep(550)
    } else {
      await sleep(10)
    }
  }
  await sleep(1000)
  expect(Testing.vars.i).toBe(3)
})
