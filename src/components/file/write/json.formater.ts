import { Formater } from './formater.interface'

export class JSONFormater implements Formater {
  constructor(private readonly isPretty?: boolean) { }

  format(content: any) {
    return JSON.stringify(content, null, this.isPretty ? '  ' : undefined)
  }
}
