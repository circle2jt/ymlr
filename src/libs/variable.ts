import { callFunctionScript } from 'src/libs/async-function'
import { inspect } from 'util'

const REGEX_FIRST_ALPHA = /(^_$)|(^[A-Za-z])/
const PATTERN_JS_CODE_BLOCK = /^[\r\n\s\t]*\$\{(.*?)\}[\r\n\s\t]*$/gs

export async function setVars(varObj: any, vl: any, ctx: any, others: any) {
  if (!varObj) return
  const $vars = others.$vars
  if (typeof varObj === 'string') {
    $vars[varObj] = vl
    return [varObj]
  }
  const keys = Object.keys(varObj)
    .filter(key => REGEX_FIRST_ALPHA.test(key))
  if (keys.length) {
    await Promise.all(keys.map(async (k) => {
      if (k !== '_') {
        $vars[k] = await getVars(varObj[k], ctx, others)
      } else {
        await getVars(varObj[k], ctx, others)
      }
    }))
  }
  return keys
}

export async function getVars(exp: any, ctx: any, others: any) {
  if (!exp) return exp

  const evalExp = isGetEvalExp(exp)
  if (!evalExp) return exp

  if (evalExp === String) {
    let vl: any
    do {
      if (PATTERN_JS_CODE_BLOCK.test(exp)) {
        const str = exp.replace(PATTERN_JS_CODE_BLOCK, '$1')
        try {
          vl = await callFunctionScript('return (' + str + ')', ctx, others)
        } catch {
          vl = await callFunctionScript('return `' + exp + '`', ctx, others)
        }
      } else {
        vl = await callFunctionScript('return `' + exp + '`', ctx, others)
      }
    } while (typeof vl === 'string' && vl.includes('${'))
    return vl
  }
  if (evalExp === Object) {
    const obj = await evalObject(exp, ctx, others)
    return obj
  }
}

export function isGetEvalExp(vl: any) {
  if (!vl) return null
  if (typeof vl === 'string') {
    if (vl.includes('${')) {
      return String
    }
  } else if (vl.constructor === Object || vl.constructor === Array) {
    if (isGetEvalExp(inspect(vl, false, Infinity, false))) {
      return Object
    }
  }
  return null
}

export function cloneDeep<T>(obj: T): T {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj
}

async function evalObject(obj: any, ctx: any, others: any) {
  if (Array.isArray(obj)) {
    const vl: any[] = await Promise.all(
      obj.map(async o => await getVars(o, ctx, others))
    )
    return vl
  }
  const validKeys = Object.keys(obj).filter(key => REGEX_FIRST_ALPHA.test(key))
  if (validKeys.length) {
    await Promise.all(validKeys.map(async key => {
      obj[key] = await getVars(obj[key], ctx, others)
    }))
  }
  return obj
}
