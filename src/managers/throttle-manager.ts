import { type DebouncedFunc } from 'lodash'

export class ThrottleManager extends Map<string, DebouncedFunc<any>> {
  static #Instance: ThrottleManager

  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new ThrottleManager()
    }
    return this.#Instance
  }
}
