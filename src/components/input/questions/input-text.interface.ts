import { InputInterface } from '../input.interface'

export interface InputTextInterface extends InputInterface {
  readonly type: 'text'
}
