import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNDebounce } from './fn-debounce'
import { FNDebounceFlush } from './fn-debounce-flush'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('flush a fn-debounce', async () => {
  Testing.vars.id = 0
  const fnDebounce = await Testing.createElementProxy(FNDebounce, {
    name: 'dtask1f',
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
    await fnDebounce.exec()
    await fnDebounce.exec()
    const fnDebounceFlush = await Testing.createElementProxy(FNDebounceFlush, 'dtask1f')
    await fnDebounceFlush.exec()
    await fnDebounceFlush.dispose()

    await sleep(200)

    expect(Testing.vars.id).toBe(2)
  } finally {
    await fnDebounce.dispose()
  }
})
