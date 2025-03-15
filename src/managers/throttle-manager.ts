import { type FNThrottle } from 'src/components/fn-throttle/fn-throttle'

export class ThrottleManager extends Map<string, FNThrottle> {
  static #Instance: ThrottleManager

  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new ThrottleManager()
    }
    return this.#Instance
  }

  touch(name: string) {
    this.get(name)?.touch()
  }

  cancel(name: string) {
    this.get(name)?.cancel()
  }

  flush(name: string) {
    this.get(name)?.flush()
  }

  delete(name: string) {
    this.cancel(name)
    return super.delete(name)
  }
}
