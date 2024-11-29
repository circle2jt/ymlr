import { sleep } from 'src/libs/time'
import { ThrottleManager } from 'src/managers/throttle-manager'
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
      wait: 500,
      autoRemove: false
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
  expect(ThrottleManager.Instance.has('ttask1')).toBe(true)
})

test('fn-throttle recall', async () => {
  const fnThrottle = await Testing.createElementProxy(FNThrottle, {
    name: 'ttask2',
    leading: false,
    trailing: true,
    wait: 200,
    autoRemove: true
  }, {
    runs: [
      {
        js: '$vars.i++'
      }
    ]
  })
  try {
    Testing.vars.i = 0
    await fnThrottle.exec()
    for (let i = 0; i < 3; i++) {
      await sleep(90)
      const recaller = await Testing.createElementProxy(FNThrottle, 'ttask2')
      await recaller.exec()
      await recaller.dispose()
    }
  } finally {
    await fnThrottle.dispose()
  }
  await sleep(1000)
  expect(Testing.vars.i).toBe(2) // Removed then no found ttask2 to reset
  expect(ThrottleManager.Instance.has('ttask2')).toBe(false)
})
