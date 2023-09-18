import assert from 'assert'
import { formatTextToMs } from 'src/libs/format'
import { sleep } from 'src/libs/time'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

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
    - name: Sleep 10s
      sleep: 10000          # Sleep 10s then keep continue
  ```
*/
export class Sleep implements Element {
  readonly proxy!: ElementProxy<this>

  constructor(public duration: number | string) { }

  async exec() {
    this.duration = formatTextToMs(this.duration)
    assert(this.duration)
    await sleep(this.duration)
    return this.duration
  }

  dispose() { }
}
