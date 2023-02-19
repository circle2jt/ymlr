import chalk from 'chalk'
import { InputConfirm } from 'src/components/input/questions/input-confirm'
import { ElementProxy } from '../element-proxy'
import { Element } from '../element.interface'

/** |**  pause
  Pause the program then wait to user enter to continue
  @example
  ```yaml
    - pause:

    - name: Pause here
      pause:
  ```
*/
export class Pause implements Element {
  readonly ignoreEvalProps = ['confirm']
  readonly proxy!: ElementProxy<this>

  private confirm?: InputConfirm

  private getInputOptions() {
    return { label: '⏸ Continue ?', yes: 'Continue', no: chalk.red('Stop now') }
  }

  async exec() {
    this.confirm = new InputConfirm({ default: true, ...this.getInputOptions() })
    const isContinue = await this.confirm.exec()
    if (!isContinue) process.exit(1)
  }

  async continue() {
    await this.confirm?.answer('')
  }

  dispose() { }
}
