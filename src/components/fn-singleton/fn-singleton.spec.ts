import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNSingleton } from './fn-singleton'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-singleton should be auto remove when done', async () => {
  Testing.vars.i = 0
  const fn = await Testing.createElementProxy(FNSingleton, {
    name: 'stask2',
    trailing: false,
    autoRemove: true
  }, {
    runs: [
      {
        sleep: 200
      }
    ]
  })
  try {
    await fn.exec()
  } finally {
    await fn.dispose()
  }
  expect(FNSingleton.Caches.size).toBe(0)
})

test('fn-singleton should be run correctly with no trailing', async () => {
  Testing.vars.i = 0
  const fn = await Testing.createElementProxy(FNSingleton, {
    name: 'stask2',
    trailing: false
  }, {
    runs: [
      {
        sleep: '200'
      },
      {
        js: '$vars.i++'
      }
    ]
  })
  for (let i = 0; i < 4; i++) {
    void fn.exec()
    if (i > 1) {
      await sleep(500)
    }
  }
  await fn.dispose()
  expect(Testing.vars.i).toBe(2)
})

test('fn-singleton should be run correctly with trailing is true', async () => {
  Testing.vars.i = 0
  const fn = await Testing.createElementProxy(FNSingleton, {
    name: 'stask1',
    trailing: true
  }, {
    runs: [
      {
        sleep: '200'
      },
      {
        js: '$vars.i++'
      }
    ]
  })
  for (let i = 0; i < 4; i++) {
    void fn.exec()
    if (i > 1) {
      await sleep(500)
    }
  }
  await fn.dispose()
  expect(Testing.vars.i).toBe(3)
})
