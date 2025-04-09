import { type FNDebounce } from 'src/components/fn-debounce/fn-debounce'

export class DebounceManager extends Map<string, FNDebounce> {
  static #Instance: DebounceManager

  static get Instance() {
    if (!this.#Instance) {
      this.#Instance = new DebounceManager()
    }
    return this.#Instance
  }

  touch(name: string, debounceData?: any) {
    this.get(name)?.touch(debounceData)
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
