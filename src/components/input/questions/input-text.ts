import { type InputTextInterface } from './input-text.interface'
import { InputAbstract } from './input.abstract'

export class InputText extends InputAbstract<InputTextInterface> {
  readonly type = 'text'
}
