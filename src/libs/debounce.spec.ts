import { debounce } from './debounce'
import { sleep } from './time'

describe('debounce', () => {
  test('trailing: should call after wait', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { trailing: true })

    d(1)
    d(2)

    expect(fn).not.toBeCalled()

    await sleep(80)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(2)
  })

  test('leading: should call immediately', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { leading: true, trailing: false })

    d(1)
    d(2)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(1)
  })

  test('leading + trailing', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { leading: true, trailing: true })

    d(1)
    d(2)

    expect(fn).toBeCalledTimes(1)

    await sleep(80)

    expect(fn).toBeCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(2)
  })

  test('should refresh timer on multiple calls', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { trailing: true })

    d(1)
    await sleep(30)
    d(2)
    await sleep(30)
    d(3)

    await sleep(80)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(3)
  })

  test('maxWait should force execution', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 100, { trailing: true, maxWait: 50 })

    d(1)
    await sleep(20)
    d(2)
    await sleep(20)
    d(3)

    await sleep(60)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(3)
  })

  test('cancel should prevent execution', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { trailing: true })

    d(1)
    d.cancel()

    await sleep(80)

    expect(fn).not.toBeCalled()
  })

  test('flush should execute immediately', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 100, { trailing: true })

    d(1)
    await sleep(20)

    d.flush()

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(1)
  })

  test('waitToDone should resolve after execution', async () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { trailing: true })

    d(1)

    await d.waitToDone()

    expect(fn).toBeCalledTimes(1)
  })

  test('should throw if both leading and trailing are false', () => {
    const fn = jest.fn()
    const d = debounce(fn, 50, { leading: false, trailing: false })

    expect(() => d(1)).toThrow()
  })
})
