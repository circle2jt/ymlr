import { type InputInterface } from '../input.interface'

export interface InputConfirmInterface extends InputInterface {
  readonly type: 'confirm'
}
