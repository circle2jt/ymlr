import { formatTextToMs } from './format'

export async function sleep(time: number) {
  return await new Promise(resolve => setTimeout(resolve, formatTextToMs(time)))
}
