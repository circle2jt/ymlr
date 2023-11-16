import { type InputSelectInterface } from './input-select.interface'
import { InputAbstract } from './input.abstract'

export class InputSelect extends InputAbstract<InputSelectInterface> {
  override readonly type = 'select'
  choices: Array<{ title: string, value: any }> = []

  constructor({ choices, ...props }: Partial<InputSelectInterface>) {
    super(props)
    Object.assign(this, { choices })
  }

  override async exec(): Promise<boolean | null | undefined> {
    this.choices.forEach((choice, i) => {
      if (this.default !== undefined && this.default === choice.value) {
        this.default = +i
      }
    })
    return await super.exec()
  }
}
