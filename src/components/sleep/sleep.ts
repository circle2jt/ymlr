import { sleep } from 'src/libs/time'
import { ElementShadow } from '../element-shadow'
import { SleepProps } from './sleep.props'

/** |**  sleep
  Sleep the program then wait to user enter to continue
  @example
  Sleep for a time
  - 1d = 1 day
  - 1h = 1 hour
  - 1m = 1 minute
  - 1s = 1 second
  - 1ms = 1 milisecond
  ```yaml
    - sleep: 10000            # Sleep 10s then keep continue
    - sleep: 10s              # Sleep 10s then keep continue
    - sleep: 1h1m20s          # Sleep in 1 hour, 1 minute and 20 seconds then keep continue
  ```

  Full props
  ```yaml
    - sleep:
        title: Sleep 10s
        duration 10000          # Sleep 10s then keep continue
  ```
*/
export class Sleep extends ElementShadow {
  duration?: number

  constructor(props: SleepProps) {
    super()
    if (typeof props !== 'object') {
      props = {
        duration: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    if (!this.duration) return
    await sleep(this.duration)
  }
}
