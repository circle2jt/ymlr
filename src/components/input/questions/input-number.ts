import { type InputNumberInterface } from './input-number.interface'
import { InputAbstract } from './input.abstract'

export class InputNumber extends InputAbstract<InputNumberInterface> {
  override readonly type = 'number'
}
