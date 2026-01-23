import { throttle } from './throttle'
import { sleep } from './time'

describe('throttle', () => {
  test('trailing only: should call after wait', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { trailing: true })

    t(1)
    t(2)

    expect(fn).not.toBeCalled()

    await sleep(80)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(2)
  })

  test('leading only: should call immediately', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { leading: true, trailing: false })

    t(1)
    t(2)
    t(3)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(1)

    await sleep(60)

    // Should not call again
    expect(fn).toBeCalledTimes(1)
  })

  test('leading + trailing', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { leading: true, trailing: true })

    t(1)
    t(2)
    t(3)

    // leading
    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(1)

    await sleep(80)

    // trailing
    expect(fn).toBeCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3)
  })

  test('should ignore calls while running', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { trailing: true })

    t(1)
    t(2)
    t(3)

    await sleep(80)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(3)
  })

  test('cancel should prevent execution', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { trailing: true })

    t(1)
    t.cancel()

    await sleep(80)

    expect(fn).not.toBeCalled()
  })

  test('flush should execute immediately', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 100, { trailing: true })

    t(1)
    await sleep(20)

    t.flush()

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(1)
  })

  test('waitToDispose should resolve after autoDispose', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { trailing: true })

    t(1)

    await t.waitToDispose()

    expect(fn).toBeCalledTimes(1)
  })

  test('should throw if both leading and trailing are false', () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { leading: false, trailing: false })

    expect(() => t(1)).toThrow()
  })

  test('should use latest arguments', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { trailing: true })

    t('a')
    await sleep(10)
    t('b')
    await sleep(10)
    t('c')

    await sleep(80)

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith('c')
  })

  test('leading only should unlock after wait', async () => {
    const fn = jest.fn()
    const t = throttle(fn, 50, { leading: true, trailing: false })

    t(1)
    await sleep(60)
    t(2)

    expect(fn).toBeCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(2)
  })
})
