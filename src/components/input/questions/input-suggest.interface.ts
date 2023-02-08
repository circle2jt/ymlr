import { InputInterface } from '../input.interface'
import { SuggestType } from './input-suggest'

export interface InputSuggestInterface extends InputInterface {
  readonly type: 'autocomplete'
  limit?: number
  style?: string
  suggestType?: keyof SuggestType
  suggest?: (inp: string, choices: any[]) => any
  choices: Array<{ title: string, value: any }>
}
