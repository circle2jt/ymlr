import { Input } from './input'
import { InputText } from './questions/input-text'
import { InputTextProps } from './text.props'

/** |**  input'text
  Get user input from keyboard then convert to text
  @example
  ```yaml
  # - input:
    - input'text:
        title: Enter your name
        vars: name
        default: Noname # !optional
        required: true  # !optional
  ```
*/
export class Text extends Input<InputTextProps> {
  protected InputClass = InputText
}
