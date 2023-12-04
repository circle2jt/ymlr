import { sleep } from 'src/libs/time'
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
      name: 'task1',
      leading: false,
      trailing: true,
      wait: '500'
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
  expect(Testing.vars.i).toBe(2)
})
