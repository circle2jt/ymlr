import { InputPasswordInterface } from './input-password.interface'
import { InputAbstract } from './input.abstract'

export class InputPassword extends InputAbstract<InputPasswordInterface> {
  readonly type = 'password'
}
