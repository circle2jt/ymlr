import { type FNSingleton } from 'src/components/fn-singleton/fn-singleton'

export class SingletonManager extends Map<string, FNSingleton> {
  private static _Instance: SingletonManager

  static get Instance() {
    if (!this._Instance) {
      this._Instance = new SingletonManager()
    }
    return this._Instance
  }

  touch(name: string, debounceData?: any) {
    this.get(name)?.touch(debounceData)
  }

  cancel(name: string) {
    this.get(name)?.cancel()
  }

  remove(name: string) {
    this.get(name)?.remove()
  }
}
