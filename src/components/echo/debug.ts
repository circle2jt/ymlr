import { formatDate } from 'src/libs/format'
import { Echo } from './echo'

/** |**  echo'debug
  Add more information when print to console screen
  @order 5
  @example
  Print a message
  ```yaml
    - echo'debug: Hello world

    - echo'debug:
        showTime: true        # Default prepend execution time into log
        content: Hello
  ```
*/
export class EchoDebug extends Echo {
  showTime = true

  constructor(props: any) {
    super(props)
    this.showTime = props?.showTime
  }

  format(input: string) {
    return `${formatDate(new Date())}\t${super.format(input)}`
  }
}
