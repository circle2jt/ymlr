import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNDebounce } from './fn-debounce'
import { FNDebounceDelete } from './fn-debounce-delete'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('delete a fn-debounce', async () => {
  Testing.vars.i = 0
  const fnDebounce = await Testing.createElementProxy(FNDebounce, {
    name: 'dtaskd1',
    leading: false,
    trailing: true,
    wait: 200
  }, {
    runs: [
      {
        js: '$vars.i++'
      }
    ]
  })
  try {
    await fnDebounce.exec()
    const fnDebounceDelete = await Testing.createElementProxy(FNDebounceDelete, 'dtaskd1')
    await fnDebounceDelete.exec()
    await fnDebounceDelete.dispose()

    await sleep(210)

    expect(Testing.vars.i).toBe(0)
    expect(FNDebounce.Caches.has('dtaskd1')).toBeFalsy()
  } finally {
    await fnDebounce.dispose()
  }
})
