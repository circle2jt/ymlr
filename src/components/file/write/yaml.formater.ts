import { dump } from 'js-yaml'
import { Formater } from './formater.interface'

export class YAMLFormater implements Formater {
  format(content: any) {
    return dump(content, { indent: 2 })
  }
}
