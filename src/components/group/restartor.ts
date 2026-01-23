export class Restartor {
  private isStop?: boolean
  public t?: Promise<any>
  next?: Promise<any>

  constructor(public name: string) { }

  async exec() {
    while (!this.isStop && this.t) {
      await this.t
      this.t = this.next
      this.next = undefined
    }
  }

  async stop() {
    this.isStop = true
    await this.t
    this.t = this.next = undefined
  }
}
