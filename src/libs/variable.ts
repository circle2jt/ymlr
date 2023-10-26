import { callFunctionScript } from 'src/libs/async-function'
import { inspect } from 'util'

export async function setVars(varObj: any, vl: any, ctx: any, others: any) {
  if (!varObj) return
  const $vars = others.$vars
  if (typeof varObj === 'string') {
    $vars[varObj] = vl
    return [varObj]
  }
  const keys = Object.keys(varObj)
  for (const k of keys) {
    $vars[k] = await getVars(varObj[k], ctx, others)
  }
  return keys
}

export async function getVars(exp: any, ctx: any, others: any) {
  if (exp) {
    const evalExp = isGetEvalExp(exp)
    if (evalExp === String) {
      let str = `\`${exp}\``
      if (str[1] === '$' && str[str.length - 2] === '}') {
        str = str.replace(/^`\$\{([^}]+)\}`$/, '$1')
      }
      let vl: any = await callFunctionScript(`return ${str}`, ctx, others)
      if (typeof vl === 'string' && vl.includes('${')) {
        vl = await getVars(vl, ctx, others)
      }
      return vl
    } else if (evalExp === Object) {
      const obj = await evalObject(exp, ctx, others)
      return obj
    }
  }
  return exp
}

export function isGetEvalExp(vl: any) {
  if (!vl) return null
  if (typeof vl === 'string') {
    if (vl.includes('${')) return String
  } else if (typeof vl === 'object') {
    const typeName = vl.constructor?.toString()
    if (typeName?.startsWith('function Object() ') || typeName?.startsWith('function Array() ')) {
      if (isGetEvalExp(inspect(vl, false, Infinity, false))) return Object
    }
  }
  return null
}

export function cloneDeep<T>(obj: T): T {
  if (typeof obj === 'object' && obj) {
    return JSON.parse(JSON.stringify(obj))
  }
  return obj
}

async function evalObject(obj: any, ctx: any, others: any) {
  if (Array.isArray(obj)) {
    const vl: any[] = await Promise.all(obj.map(async o => await getVars(o, ctx, others)))
    return vl
  }
  for (const k of Object.keys(obj)) {
    obj[k] = await getVars(obj[k], ctx, others)
  }
  return obj
}
