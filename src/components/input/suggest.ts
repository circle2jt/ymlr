import { Input } from './input'
import { InputSuggest } from './questions/input-suggest'
import { type InputSuggestProps } from './suggest.props'

/** |**  input'suggest
  Suggest a list of choices for user then allow pick a choice or create a new one
  @example
  ```yaml
  # - input'sug:
    - input'suggest:
        title: Your hobby
        choices:
          - title: Football
            value: football
          - title: Basket Ball
            value: backetball
        default: football                         # !optional
        required: true                            # !optional
        suggestType: INCLUDE_AND_ALLOW_NEW        # Must be in [STARTSWITH_AND_ALLOW_NEW, INCLUDE_AND_ALLOW_NEW, STARTSWITH, INCLUDE]
                                                  # - "INCLUDE": Only find in the text in the list suggestions
                                                  # - "INCLUDE_AND_ALLOW_NEW": Same "INCLUDE" and allow to create a new one if not in the list suggestions
                                                  # - "STARTSWITH": Only find in the start of text
                                                  # - "STARTSWITH_AND_ALLOW_NEW": Same "STARTSWITH" and allow to create a new one if not in the list suggestions
      vars: hobby
  ```
*/
export class Suggest extends Input<InputSuggestProps> {
  protected InputClass = InputSuggest
}
