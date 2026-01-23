import EventEmitter from 'events'

export interface ThrottleSettings { leading?: boolean, trailing?: boolean }
export interface ThrottledFunc {
  (...args: any): Throttle

  get data(): any

  cancel: () => void
  flush: () => void
  waitToDispose: () => Promise<true>
  dispose: () => any
  onDone?: () => any
}

export function throttle(cb: (...args: any) => any, wait: number, opts: ThrottleSettings & { autoDispose?: boolean }) {
  const db = new Throttle(cb, wait, opts)
  const fn: any = db.exec.bind(db)
  Object.defineProperty(fn, 'data', {
    get() {
      return db.data
    }
  })
  fn.cancel = db.cancel.bind(db)
  fn.flush = db.flush.bind(db)
  fn.dispose = db.dispose.bind(db)
  fn.waitToDispose = db.waitToDispose.bind(db)
  if (opts?.autoDispose) {
    db.afterDone = async () => {
      await fn.onDone?.()
      db.dispose()
    }
  }
  return fn as ThrottledFunc
}

export class Throttle extends EventEmitter {
  private tm?: NodeJS.Timeout
  data?: any[]
  isRunning: boolean = false

  #waitToDispose: {
    proms?: Promise<true>
    resolve?: any
    reject?: any
  } = {}

  constructor(private readonly cb: (...args: any) => any, private readonly wait: number, private readonly opts: ThrottleSettings = { trailing: true }) {
    super({ captureRejections: true })
    this
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .on('exec', async () => {
        try {
          await this.cb(...(this.data || []))
        } catch (err) {
          this.emit('error', err)
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .on('done', async (isCb = true) => {
        // console.log('done')
        this.cancel()
        try {
          isCb && await this.cb(...(this.data || []))
        } catch (err) {
          this.emit('error', err)
        } finally {
          await this.afterDone()
          this.#waitToDispose.resolve?.(true)
        }
      })
      .on('error', (err) => {
        this.#waitToDispose.reject?.(err)
      })
  }

  exec(...prms: any[]) {
    if (!this.opts.leading && !this.opts.trailing) {
      throw new Error('At least one of leading or trailing must be true')
    }

    this.data = prms

    if (this.tm) {
      // console.log('ignore')
      return this
    }

    if (!this.isRunning) {
      this.isRunning = true

      if (this.opts.leading) {
        // console.log('do it')
        this.emit('exec')
        if (!this.opts.trailing) {
          this.tm = setTimeout(() => this.emit('done', false), this.wait)
        }
      }

      if (!this.#waitToDispose?.proms) {
        this.#waitToDispose.proms = new Promise((resolve, reject) => {
          this.#waitToDispose.resolve = resolve
          this.#waitToDispose.reject = reject
        })
      }
    }

    if (this.opts.trailing) {
      // console.log('timeout', this.wait)
      this.tm = setTimeout(() => this.emit('done', true), this.wait)
    }
    return this
  }

  cancel() {
    if (!this.isRunning) return
    // console.log('cancel')
    clearTimeout(this.tm)
    this.isRunning = false
    this.tm = undefined
  }

  flush() {
    if (!this.isRunning) return
    // console.log('flush')
    this.emit('done', true)
  }

  async afterDone() { }

  dispose() {
    this.cancel()
    this.removeAllListeners()
    this.#waitToDispose.resolve?.(true)
    this.#waitToDispose.proms = this.data = undefined
  }

  async waitToDispose() {
    await this.#waitToDispose?.proms
  }
}
