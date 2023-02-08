import chalk from 'chalk'
import { InputConfirm } from 'src/components/input/questions/input-confirm'
import { ElementShadow } from '../element-shadow'
import { PauseProps } from './pause.props'

/** |**  pause
  Pause the program then wait to user enter to continue
  @example
  ```yaml
    - pause:

    - pause:
        title: Pause here
  ```
*/
export class Pause extends ElementShadow {
  $$ignoreEvalProps = ['confirm']

  label?: string

  private confirm?: InputConfirm

  constructor(props?: PauseProps) {
    super()
    if (props && typeof props === 'object') {
      props.label = props.title
      props.title = undefined
    }
    Object.assign(this, props)
  }

  private getInputOptions() {
    return { label: '⏸ ' + (this.label || 'Continue ?'), yes: 'Continue', no: chalk.red('Stop now') }
  }

  async exec() {
    this.confirm = new InputConfirm({ default: true, ...this.getInputOptions() })
    const isContinue = await this.confirm.exec()
    if (!isContinue) process.exit(1)
  }

  async continue() {
    await this.confirm?.answer('')
  }
}
