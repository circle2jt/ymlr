import { formatTextToMs } from './format'

export async function sleep(time: number | string) {
  return await new Promise(resolve => setTimeout(resolve, formatTextToMs(time)))
}
