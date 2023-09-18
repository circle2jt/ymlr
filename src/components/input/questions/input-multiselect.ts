import { type InputMultiSelectInterface } from './input-multiselect.interface'
import { InputAbstract } from './input.abstract'

export class InputMultiSelect extends InputAbstract<InputMultiSelectInterface> {
  readonly type = 'multiselect'
  choices: Array<{ title: string, value: any, selected?: boolean }> = []

  constructor({ choices, ...props }: Partial<InputMultiSelectInterface>) {
    super(props)
    Object.assign(this, { choices })
  }

  override async exec(): Promise<boolean | null | undefined> {
    if (this.default !== undefined && !Array.isArray(this.default)) {
      this.default = [this.default]
    }
    this.choices.forEach((choice) => {
      if (this.default?.includes(choice.value)) {
        choice.selected = true
      }
    })
    return await super.exec()
  }
}
