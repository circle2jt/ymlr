import { InputNumberInterface } from './input-number.interface'
import { InputAbstract } from './input.abstract'

export class InputNumber extends InputAbstract<InputNumberInterface> {
  readonly type = 'number'
}
