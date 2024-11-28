import { formatTextToMs } from './format'

type DateTimeUnit = 'YYYY' | 'MM' | 'DD' | 'hh' | 'mm' | 'ss' | 'ms'

export async function sleep(time: number | string) {
  const delayTime = formatTextToMs(time)
  if (!delayTime) return
  return await new Promise(resolve => setTimeout(resolve, delayTime))
}

export function toDate(dateString: string, format: string) {
  const datePattern = new RegExp(format
    .replace('YYYY', '(\\d{4})')
    .replace('MM', '(\\d{1,2})')
    .replace('DD', '(\\d{1,2})')
    .replace('hh', '(\\d{1,2})')
    .replace('mm', '(\\d{1,2})')
    .replace('ss', '(\\d{1,2})')
    .replace('ms', '(\\d{1,3})'))
  const formatPattern = new RegExp(format
    .replace('YYYY', '(YYYY)')
    .replace('MM', '(MM)')
    .replace('DD', '(DD)')
    .replace('hh', '(hh)')
    .replace('mm', '(mm)')
    .replace('ss', '(ss)')
    .replace('ms', '(ms)'))

  const mFormat = format.match(formatPattern)
  const formatValues = mFormat?.slice(1) as DateTimeUnit[] | undefined

  const mDate = dateString.match(datePattern)
  const dateValues: number[] = mDate?.slice(1).map(v => +v.trim()) ?? []

  if (!formatValues?.length || !dateValues?.length || formatValues.length !== dateValues.length) {
    throw new Error(`Invalid date: ${dateString} with format: ${format}`)
  }

  const dateValue = formatValues.reduce<Record<DateTimeUnit, number>>((obj, name, i) => {
    obj[name] = dateValues[i]
    return obj
  }, { YYYY: 0, MM: 0, DD: 0, hh: 0, mm: 0, ss: 0, ms: 0 })

  return new Date(dateValue.YYYY, dateValue.MM - 1, dateValue.DD, dateValue.hh, dateValue.mm, dateValue.ss, dateValue.ms)
}
