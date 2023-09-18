import { load } from 'js-yaml'
import { type Formater } from './formater.interface'

export class YAMLFormater implements Formater {
  format(content: string) {
    return load(content)
  }
}
