
const AsyncFunction = async function () { }.constructor as new (...args: any) => Function

export async function callFunctionScript(script: string, ctx: any, others: Record<string, any> = {}) {
  const args = Object.assign({ require }, others)
  const keys = Object.keys(args)
  const func = new AsyncFunction(...keys, script)
  const vl: any = await func.call(ctx, ...keys.map(k => args[k]))
  return vl
}
