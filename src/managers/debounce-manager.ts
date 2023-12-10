import { type DebouncedFunc } from 'lodash'

export class DebounceManager extends Map<string, DebouncedFunc<any>> {
  static #Instance: DebounceManager

  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new DebounceManager()
    }
    return this.#Instance
  }
}
