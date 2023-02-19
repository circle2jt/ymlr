import { InputInterface } from '../input.interface'

export interface InputSelectInterface extends InputInterface {
  readonly type: 'select'
  choices: Array<{ title: string, value: any }>
}
