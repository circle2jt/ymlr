import { Input } from './input'
import { InputMultiSelectProps } from './multiselect.props'
import { InputMultiSelect } from './questions/input-multiselect'

/** |**  input'multiselect
  Suggest a list of choices for user then allow pick multiple choices
  @example
  ```yaml
  # - input'msel:
    - input'multiselect:
        title: Please select your hobbies ?
        vars: hobbies
        choices:
          - title: Tennis
            value: tn
          - title: Football
            value: fb
          - title: Basket ball
            value: bb
        default: [tn, fb]   # !optional
        required: true      # !optional
  ```
*/
export class MultiSelect extends Input<InputMultiSelectProps> {
  protected InputClass = InputMultiSelect
}
