import { dump } from 'js-yaml'
import { type Formater } from './formater.interface'

export class YAMLFormater implements Formater {
  format(content: any) {
    return dump(content, { indent: 2, lineWidth: -1, sortKeys: true })
  }
}
