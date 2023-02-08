import { Input } from './input'
import { InputNumberProps } from './number.props'
import { InputNumber } from './questions/input-number'

/** |**  input'number
  Get user input from keyboard then convert to number
  @example
  ```yaml
  # - input'num:
    - input'number:
        title: Enter your age ?
        vars: age
        default: 18     # !optional
        required: true  # !optional
  ```
*/
export class Number extends Input<InputNumberProps> {
  protected InputClass = InputNumber
}
