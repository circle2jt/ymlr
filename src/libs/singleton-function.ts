const NO_CALL = Symbol('SINGLETON_NO_CALL')

export function singleton(func: (...args: any[]) => any, opts?: { trailing?: boolean }) {
  let lock = false
  let lastPrms: any[] | symbol = NO_CALL
  const fn = async (...prms: any[]) => {
    if (lock) {
      if (opts?.trailing) {
        lastPrms = prms
      }
      return
    }
    lock = true
    let rs: any
    try {
      do {
        if (lastPrms !== NO_CALL) {
          prms = lastPrms as any[]
          lastPrms = NO_CALL
        }
        rs = await func(...prms)
      } while (lastPrms !== NO_CALL)
    } finally {
      lock = false
      if (fn.onDone) {
        await fn.onDone()
      }
    }
    return rs
  }
  fn.onDone = undefined as unknown as () => any | any
  return fn
}
