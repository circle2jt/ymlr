import { type InputConfirmInterface } from './input-confirm.interface'
import { InputAbstract } from './input.abstract'

export class InputConfirm extends InputAbstract<InputConfirmInterface> {
  override readonly type = 'confirm'
}
