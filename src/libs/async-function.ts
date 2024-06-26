const AsyncFunction = async function () { }.constructor as new (...args: any) => (...args: any[]) => any

export async function callFunctionScript(script: string, ctx: any, others: Record<string, any> = {}) {
  const args = Object.assign({ require }, others)
  const keys = Object.keys(args)
  const func = new AsyncFunction(...keys, script)
  const vl: any = await func.call(ctx, ...keys.map(k => args[k]))
  return vl
}

export function bindFunctionScript(script: string, ctx: any, ...prmsName: string[]) {
  const func = new AsyncFunction(...prmsName, script)
  const vl: any = func.bind(ctx)
  return vl
}
