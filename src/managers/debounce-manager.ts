import { type FNDebounce } from 'src/components/fn-debounce/fn-debounce'
import { debounce } from 'src/libs/debounce'

export class DebounceManager extends Map<string, FNDebounce> {
  private static _Instance: DebounceManager

  static get Instance() {
    if (!this._Instance) {
      this._Instance = new DebounceManager()
    }
    return this._Instance
  }

  new() {
    return debounce
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

  remove(name: string) {
    this.get(name)?.remove()
  }
}
