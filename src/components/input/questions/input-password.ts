import { type InputPasswordInterface } from './input-password.interface'
import { InputAbstract } from './input.abstract'

export class InputPassword extends InputAbstract<InputPasswordInterface> {
  override readonly type = 'password'
}
