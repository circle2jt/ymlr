import { InputConfirmProps } from './confirm.props'
import { Input } from './input'
import { InputConfirm } from './questions/input-confirm'

/** |**  input'confirm
  Get user confirm (yes/no)
  @example
  ```yaml
  # - input'conf:
    - input'confirm:
        title: Are you sure to delete it ?
        vars: userWantToDelete
        default: false  # !optional
        required: true  # !optional
  ```
*/
export class Confirm extends Input<InputConfirmProps> {
  protected InputClass = InputConfirm
}
