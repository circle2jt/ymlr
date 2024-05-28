import { sleep } from 'src/libs/time'
import { DebounceManager } from 'src/managers/debounce-manager'
import { Testing } from 'src/testing'
import { FNDebounce } from './fn-debounce'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('fn-debounce should be run correctly', async () => {
  Testing.vars.i = 0
  for (let i = 0; i < 4; i++) {
    const fnDebounce = await Testing.createElementProxy(FNDebounce, {
      name: 'dtask1',
      leading: false,
      trailing: true,
      wait: 500,
      autoRemove: true
    }, {
      runs: [
        {
          js: '$vars.i++'
        }
      ]
    })
    try {
      await fnDebounce.exec()
    } finally {
      await fnDebounce.dispose()
    }
    if (i > 1) {
      await sleep(550)
    } else {
      await sleep(10)
    }
  }
  await sleep(1000)
  expect(Testing.vars.i).toBe(2)
  expect(DebounceManager.Instance.has('dtask1')).toBe(false)
})

test('fn-debounce recall', async () => {
  const fnDebounce = await Testing.createElementProxy(FNDebounce, {
    name: 'dtask2',
    leading: false,
    trailing: true,
    wait: 200,
    autoRemove: false
  }, {
    runs: [
      {
        js: '$vars.end = Date.now() - $vars.begin'
      },
      {
        js: '$vars.i++'
      }
    ]
  })
  try {
    Testing.vars.begin = Date.now()
    Testing.vars.i = 0
    await fnDebounce.exec()
    for (let i = 0; i < 3; i++) {
      await sleep(100)
      const recaller = await Testing.createElementProxy(FNDebounce, 'dtask2')
      await recaller.exec()
      await recaller.dispose()
    }
  } finally {
    await fnDebounce.dispose()
  }
  await sleep(500)
  expect(Testing.vars.end).toBeGreaterThan(500)
  expect(Testing.vars.i).toBe(1)
  expect(DebounceManager.Instance.has('dtask2')).toBe(true)
})
