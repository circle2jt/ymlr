import { InputSuggestInterface } from './input-suggest.interface'
import { InputAbstract } from './input.abstract'

export interface SuggestType {
  STARTSWITH_AND_ALLOW_NEW: Function
  STARTSWITH: Function
  INCLUDE_AND_ALLOW_NEW: Function
  INCLUDE: Function
}
const SuggestFunction: SuggestType = {
  STARTSWITH_AND_ALLOW_NEW(inp: string, choices: Array<{ title: string, value: any }> = []) {
    if (!inp) return choices
    const existed = choices.filter(e => e.title.toLowerCase().startsWith(inp.toLowerCase()))
    const isExisted = existed.length === 1 && existed[0].title.toLowerCase() === inp.toLowerCase()
    if (isExisted) return existed
    return [{ title: inp, value: inp, disabled: true }, ...existed]
  },
  STARTSWITH(inp: string, choices: Array<{ title: string, value: any }> = []) {
    if (!inp) return choices
    const existed = choices.filter(e => e.title.toLowerCase().startsWith(inp.toLowerCase()))
    return existed
  },
  INCLUDE_AND_ALLOW_NEW(inp: string, choices: Array<{ title: string, value: any }> = []) {
    if (!inp) return choices
    const existed = choices.filter(e => e.title.toLowerCase().includes(inp.toLowerCase()))
    const isExisted = existed.length === 1 && existed[0].title.toLowerCase() === inp.toLowerCase()
    if (isExisted) return existed
    return [{ title: inp, value: inp, disabled: true }, ...existed]
  },
  INCLUDE(inp: string, choices: Array<{ title: string, value: any }> = []) {
    if (!inp) return choices
    const existed = choices.filter(e => e.title.toLowerCase().includes(inp.toLowerCase()))
    return existed
  }
}

export class InputSuggest extends InputAbstract<InputSuggestInterface> {
  readonly type = 'autocomplete'
  choices: Array<{ title: string, value: any }> = []
  limit?: number
  style?: string
  suggestType?: keyof SuggestType

  get suggest() {
    return (this.suggestType && SuggestFunction[this.suggestType]) || SuggestFunction.INCLUDE_AND_ALLOW_NEW
  }

  constructor({ choices, limit, style, suggestType, ...props }: Partial<InputSuggestInterface>) {
    super(props)
    Object.assign(this, { choices, limit, style, suggestType })
  }

  async exec(): Promise<boolean | null | undefined> {
    this.choices.forEach((choice, i) => {
      if (this.default !== undefined && this.default === choice.value) {
        this.default = +i
      }
    })
    return await super.exec()
  }
}
