export function mutexLock(func: (...args: any[]) => any) {
  let lock = false
  return function (...prms: any[]) {
    if (lock) return
    lock = true
    let isProms = false
    try {
      const t = func(...prms)
      if (t instanceof Promise) {
        isProms = true
        return t.finally(() => {
          lock = false
        })
      }
      return t
    } finally {
      if (!isProms) {
        lock = false
      }
    }
  }
}
