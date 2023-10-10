import { formatDate } from 'src/libs/format'
import { Echo } from './echo'

/** |**  echo'debug
  Add more information when print to console screen
  @order 5
  @example
  Print a message
  ```yaml
                                              # Default prepend execution time into log
    - echo'debug: Hello world                 # => 01:01:01.101    Hello world

    - echo'debug:
        formatTime: YYYY/MM/DD hh:mm:ss.ms    # Default format is "hh:mm:ss.ms"
        content: Hello                        # => 2023/01/01 01:01:01.101    Hello
  ```
*/
export class EchoDebug extends Echo {
  formatTime = 'hh:mm:ss.ms'

  constructor(props: any) {
    super(props)
    if (props?.formatTime) this.formatTime = props?.formatTime
  }

  format(input: string) {
    return `${formatDate(new Date(), this.formatTime)}    ${super.format(input)}`
  }
}
