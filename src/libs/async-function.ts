const AsyncFunction = async function () { }.constructor as new (...args: any) => (...args: any[]) => any

export async function callFunctionScript(script: string, ctx: any, others: Record<string, any> = {}) {
  const args: Record<string, any> = { require, ...others }
  const keys = Object.keys(args)
  const func = new AsyncFunction(...keys, script)
  const vl: any = await func.call(ctx, ...keys.map(k => args[k]))
  return vl
}

export function bindFunctionScript<T extends (...args: any[]) => any>(script: string, ctx: any, ...args: string[]) {
  const func = new AsyncFunction(...args, script)
  const funcWithCtx = func.bind(ctx)
  return funcWithCtx as T
}
