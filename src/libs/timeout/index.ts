function newTimeout(tout: number, name = '') {
  let t: NodeJS.Timeout | undefined
  let r: any
  return {
    start: new Promise((resolve, reject) => {
      r = resolve
      t = setTimeout(() => {
        r = undefined
        reject(new Error(`Timeout - ${name}`))
      }, tout)
    }),
    stop: () => {
      clearTimeout(t)
      r?.()
      t = r = undefined
    }
  }
}

export async function timeout(proms: Promise<any>, tout: number, name = '') {
  const timeout = newTimeout(tout, name)
  try {
    const vl = await Promise.race([
      proms,
      timeout.start
    ])
    return vl
  } finally {
    timeout.stop()
  }
}
