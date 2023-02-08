import { InputInterface } from '../input.interface'

export interface InputMultiSelectInterface extends InputInterface {
  readonly type: 'multiselect'
  choices: Array<{ title: string, value: any, selected?: boolean }>
}
