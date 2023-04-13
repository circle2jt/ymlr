export function formatNumber(n: number, opts?: Intl.NumberFormatOptions) {
  return Number(n).toLocaleString(undefined, opts)
}

export function kebabToCamelCase(snake: string) {
  return snake?.replace(/-./g, (txt) => txt[1].toUpperCase())
}

export function formatDuration(ms: number) {
  function getNum(ms: number, max: number) {
    if (ms < max) return [0, ms]
    const n = Math.floor(ms / max)
    return [n, ms - (n * max)]
  }

  const [h, remainH] = getNum(ms, 1000 * 60 * 60)
  const [m, remainM] = getNum(remainH, 1000 * 60)
  const [s, ss] = getNum(remainM, 1000)

  const time = [ss, s, m, h].filter(n => n)
  const label = ['ms', 's', 'm', 'h']
  return time.map((t, i) => `${t}${label[i]}`).reverse().join(' ')
}

export function formatTextToMs(time: string | number) {
  if (typeof time === 'number') return time
  const evalString = time.replace(/(ms)/g, '')
    .replace(/d/g, '* 24 * 60 * 60 * 1000 +')
    .replace(/h/g, '* 60 * 60 * 1000 +')
    .replace(/m/g, '* 60 * 1000 +')
    .replace(/s/g, '* 1000 +')
    .replace(/\+\s*$/, '')
  /* eslint no-new-func: "off" */
  return new Function(`return ${evalString}`)() as number
}

export function undefinedToNull(vl: any) {
  return vl !== undefined ? vl : null
}

export function tryToParseObject(str: any) {
  try {
    return str && JSON.parse(str)
  } catch {
    return str
  }
}

export function removeCircleRef(obj: any) {
  if (!obj || typeof obj !== 'object') return obj
  const str = JSON.stringify(obj, (() => {
    const seen = new WeakSet()
    return (_: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return
        }
        seen.add(value)
      }
      return value
    }
  })())
  return JSON.parse(str)
}

const AccentsMap: Record<string, RegExp> = {
  a: /[àảãáạăằẳẵắặâầẩẫấậ]/g,
  A: /[ÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ]/g,
  d: /[đ]/g,
  D: /[Đ]/g,
  e: /[èẻẽéẹêềểễếệ]/g,
  E: /[ÈẺẼÉẸÊỀỂỄẾỆ]/g,
  i: /[ìỉĩíị]/g,
  I: /[ÌỈĨÍỊ]/g,
  o: /[òỏõóọôồổỗốộơờởỡớợ]/g,
  O: /[ÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ]/g,
  u: /[ùủũúụưừửữứự]/g,
  U: /[ÙỦŨÚỤƯỪỬỮỨỰ]/g,
  y: /[ỳỷỹýỵ]/g,
  Y: /[ỲỶỸÝỴ]/g
}

export function formatFileName(name?: string, char = ' ') {
  if (!name) throw new Error('File name is required before want to format')
  Object.keys(AccentsMap)
    .forEach(uc => {
      name = name?.replace(AccentsMap[uc], uc)
    })
  return name.split('.').map(name => name.replace(/[^a-zA-Z0-9_-]+/g, char).replace(/\s\s+/g, char).trim()).join('.')
}
