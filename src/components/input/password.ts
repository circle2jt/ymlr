import { Input } from './input'
import { InputPasswordProps } from './password.props'
import { InputPassword } from './questions/input-password'

/** |**  input'password
  Get user input from keyboard but hide them then convert to text
  @example
  ```yaml
  # - input'pwd:
    - input'password:
        title: Enter your password ?
        vars: password
        required: true  # !optional
  ```
*/
export class Password extends Input<InputPasswordProps> {
  protected InputClass = InputPassword
}
