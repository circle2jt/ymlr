import { type InputInterface } from '../input.interface'

export interface InputPasswordInterface extends InputInterface {
  readonly type: 'password'
}
