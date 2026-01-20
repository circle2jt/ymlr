import { sleep } from './time'

export interface DebounceSettings { leading?: boolean, trailing?: boolean, maxWait?: number }
export interface DebouncedFunc {
  (...args: any): Debounce

  cancel: () => void
  flush: () => void
  waitToDone: () => Promise<true>
  onDone?: () => any
}

export function debounce(cb: (...args: any) => any, wait: number, opts: DebounceSettings & { autoDispose?: boolean }) {
  const db = new Debounce(cb, wait, opts)
  const fn: any = db.exec.bind(db)
  fn.cancel = db.cancel.bind(db)
  fn.flush = db.flush.bind(db)
  fn.waitToDone = db.waitToDone.bind(db)
  if (opts?.autoDispose) {
    const done = db.done.bind(db)
    db.done = async (isCb?: boolean) => {
      await done(isCb)
      return fn.onDone?.()
    }
  }
  return fn as DebouncedFunc
}

export class Debounce {
  private tm?: NodeJS.Timeout
  private tmMaxWait?: NodeJS.Timeout
  public isRunning = false
  private data?: WeakRef<any[]>
  #data?: any[]

  constructor(private readonly cb: (...args: any) => any, private readonly wait: number, private readonly opts: DebounceSettings = { trailing: true }) {
  }

  exec(...data: any[]) {
    if (!this.opts.leading && !this.opts.trailing) {
      throw new Error('At least one of leading or trailing must be true')
    }

    this.#data = data
    this.data = new WeakRef(this.#data)

    if (this.opts.leading && !this.isRunning) {
      this.cb(...(this.data.deref() || []))
      if (!this.opts.trailing) {
        setTimeout(() => this.done(false), this.wait)
      }
    }

    if (this.tm) {
      // console.log('refresh', this.wait)
      this.tm.refresh()
      this.tmMaxWait?.refresh()
      return this
    }

    this.isRunning = true

    if (this.opts.trailing) {
      // console.log('timeout', this.wait)
      this.tm = setTimeout(() => this.done(), this.wait)
    }
    if (this.opts.maxWait) {
      this.tmMaxWait = setTimeout(() => this.done(), this.opts.maxWait)
    }
    return this
  }

  done(isCb = true) {
    // console.log('done')
    this.isRunning = false
    clearTimeout(this.tm)
    this.tm = undefined
    if (this.tmMaxWait) {
      clearTimeout(this.tmMaxWait)
      this.tmMaxWait = undefined
    }
    if (isCb) {
      return this.cb(...(this.data?.deref() || []))
    }
  }

  cancel() {
    // console.log('cancel')
    clearTimeout(this.tm)
    if (this.tmMaxWait) clearTimeout(this.tmMaxWait)
    this.data = this.#data = this.tm = this.tmMaxWait = undefined
    this.isRunning = false
  }

  flush() {
    if (!this.isRunning) return
    // console.log('flush')
    return this.done(true)
  }

  async waitToDone() {
    // console.log('waitToDone')
    // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
    await new Promise(async (resolve) => {
      while (this.isRunning) {
        await sleep(100)
      }
      resolve(true)
    })
  }
}
