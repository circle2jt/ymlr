import { formatTextToMs } from './format'

export async function sleep(time: number | string) {
  const delayTime = formatTextToMs(time)
  if (!delayTime) return
  return await new Promise(resolve => setTimeout(resolve, delayTime))
}
