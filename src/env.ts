export enum OptimizeMode {
  normal = 1,
  best = 2,
}
export const DEBUG_GROUP_RESULT = process.env.DEBUG_GROUP_RESULT
export const OPTIMIZE_MODE = (OptimizeMode[process.env.OPTIMIZE_MODE as any] || OptimizeMode.normal) as OptimizeMode
