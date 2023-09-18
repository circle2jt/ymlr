import { type Formater } from './formater.interface'

export class JSONFormater implements Formater {
  format(content: string) {
    return JSON.parse(content)
  }
}
