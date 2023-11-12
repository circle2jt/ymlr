import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { EventEmiter } from '../event/emit'
import { EventOn } from '../event/on'

beforeEach(async () => {
  await Testing.reset()
})

test('test mutex', async () => {
  Testing.vars.MutexCount = 0
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    mutex: true,
    runs: [
      {
        js: '++$vars.MutexCount'
      },
      {
        sleep: 200
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()

    await sleep(40)
    await emiter.exec()
    await sleep(40)
    await emiter.exec()
    await sleep(200)

    await emiter.exec()
    await sleep(300)

    await emiter.dispose()
    await on.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.MutexCount).toEqual(2)
})

test('test debounce with mutex', async () => {
  Testing.vars.DebounceCount = 0
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    mutex: true,
    debounce: {
      time: '50ms',
      trailing: true
    },
    runs: [
      {
        js: '++$vars.DebounceCount'
      },
      {
        sleep: 200
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()
    await sleep(10)
    await emiter.exec()
    await sleep(60)

    await emiter.exec()
    await sleep(60)
    await emiter.exec()
    await sleep(200)

    await emiter.exec()
    await sleep(300)

    await emiter.dispose()
    await on.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.DebounceCount).toEqual(2)
})

test('test throttle with mutex', async () => {
  Testing.vars.ThrottleCount = 0
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    mutex: true,
    throttle: {
      time: '50ms',
      trailing: true,
      leading: true
    },
    runs: [
      {
        js: '++$vars.ThrottleCount'
      },
      {
        sleep: 200
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()
    await sleep(10)
    await emiter.exec()
    await sleep(60)
    await emiter.exec()
    await sleep(60)
    await emiter.exec()
    await sleep(200)

    await emiter.exec()
    await sleep(500)

    await emiter.dispose()
    await on.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.ThrottleCount).toEqual(2)
})

test('test debounce', async () => {
  Testing.vars.DebounceCount = 0
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    debounce: {
      time: '100ms',
      trailing: true
    },
    runs: [
      {
        js: '++$vars.DebounceCount'
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(150)
    await emiter.exec()
    await sleep(200)
    await emiter.dispose()
    await on.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.DebounceCount).toEqual(2)
})

test('test throttle', async () => {
  Testing.vars.ThrottleCount = 0
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    throttle: {
      time: '100ms',
      leading: true,
      trailing: true
    },
    runs: [
      {
        js: '++$vars.ThrottleCount'
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(30)
    await emiter.exec()
    await sleep(150)
    await emiter.exec()
    await sleep(200)
    await emiter.dispose()
    await on.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.ThrottleCount).toEqual(3)
})
