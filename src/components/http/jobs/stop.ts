import { JobStop } from 'src/components/.job/job-stop'
import { Sub } from './sub'

/** |**  http/jobs'stop
  Stop the jobs queue
  @example
  ```yaml
    - http/jobs:
        address: 0.0.0.0:3007         # Address to listen to add a new job to
        runs:                         # Steps to do a job
          - echo: Display then stop
          - http/jobs'stop:           # Stop job here
  ```
*/
export class Stop extends JobStop {
  type = Sub
}
