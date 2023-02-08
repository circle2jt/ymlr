import { parse } from 'yaml'
import { Formater } from './formater.interface'

export class YAMLFormater implements Formater {
  format(content: string) {
    return parse(content)
  }
}
