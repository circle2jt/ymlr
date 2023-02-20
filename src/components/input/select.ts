import { Input } from './input'
import { InputSelect } from './questions/input-select'
import { InputSelectProps } from './select.props'

/** |**  input'select
  Suggest a list of choices for user then allow pick a choice
  @example
  ```yaml
  # - input'sel:
    - input'select:
        title: Your sex ?
        choices:
          - title: male
            value: m
          - title: female
            value: f
        default: m      # !optional
        required: true  # !optional
      vars: sex
  ```
*/
export class Select extends Input<InputSelectProps> {
  protected InputClass = InputSelect
}
