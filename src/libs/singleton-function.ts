export function singleton(func: (...args: any[]) => any, opts?: { trailing?: boolean }) {
  let lock = false
  let isCallLast: boolean | null = false
  const fn = async function (...prms: any[]) {
    if (lock) {
      if (opts?.trailing && isCallLast === false) {
        isCallLast = true
      }
      return
    }
    lock = true
    let rs: any
    try {
      if (isCallLast === true) {
        isCallLast = false
      }
      rs = await func(...prms)
    } finally {
      lock = false
      if (isCallLast === true) {
        rs = await fn(...prms)
      }
    }
    return rs
  }
  return fn
}
