import { stringify } from 'yaml'
import { Formater } from './formater.interface'

export class YAMLFormater implements Formater {
  format(content: any) {
    return stringify(content)
  }
}
