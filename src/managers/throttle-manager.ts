import { type FNThrottle } from 'src/components/fn-throttle/fn-throttle'

export class ThrottleManager extends Map<string, FNThrottle> {
  static _Instance: ThrottleManager

  static get Instance() {
    if (!this._Instance) {
      this._Instance = new ThrottleManager()
    }
    return this._Instance
  }

  touch(name: string, throttleData?: any) {
    this.get(name)?.touch(throttleData)
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
