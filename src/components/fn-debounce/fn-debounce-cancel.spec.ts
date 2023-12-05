import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { FNDebounce } from './fn-debounce'
import { FNDebounceCancel } from './fn-debounce-cancel'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('cancel a fn-debounce', async () => {
  Testing.vars.i = 0
  const fnDebounce = await Testing.createElementProxy(FNDebounce, {
    name: 'dtaskc1',
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
    const fnDebounceCancel = await Testing.createElementProxy(FNDebounceCancel, 'dtaskc1')
    await fnDebounceCancel.exec()
    await fnDebounceCancel.dispose()

    await sleep(210)

    expect(Testing.vars.i).toBe(0)
  } finally {
    await fnDebounce.dispose()
  }
})
