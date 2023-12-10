import { DebounceManager } from './debounce-manager'

export class ThrottleManager extends DebounceManager {
  static #Instance: ThrottleManager

  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new ThrottleManager()
    }
    return this.#Instance
  }
}
