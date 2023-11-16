import { type InputSuggestInterface } from './input-suggest.interface'
import { InputAbstract } from './input.abstract'

export type SuggestHandler = (inp: string, choices: Array<{ title: string, value: any }>) => any

export interface SuggestType {
  STARTSWITH_AND_ALLOW_NEW: SuggestHandler
  STARTSWITH: SuggestHandler
  INCLUDE_AND_ALLOW_NEW: SuggestHandler
  INCLUDE: SuggestHandler
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
  override readonly type = 'autocomplete'
  choices: Array<{ title: string, value: any }> = []
  limit?: number
  style?: string
  suggestType?: keyof SuggestType
  suggest!: SuggestHandler

  constructor({ choices, limit, style, suggestType, ...props }: Partial<InputSuggestInterface>) {
    super(props)
    Object.assign(this, { choices, limit, style, suggestType })
  }

  override async exec(): Promise<boolean | null | undefined> {
    this.choices.forEach((choice, i) => {
      if (this.default !== undefined && this.default === choice.value) {
        this.default = +i
      }
    })
    this.suggest = (this.suggestType && SuggestFunction[this.suggestType]) || SuggestFunction.INCLUDE_AND_ALLOW_NEW
    return await super.exec()
  }
}
