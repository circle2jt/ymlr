
export class TemplatesManager {
  private readonly cached = new Map<string, any>()

  pushToCached(name: string, props: any) {
    this.cached.set(name, props)
  }

  getFromCached(name: string) {
    return this.cached.get(name)
  }

  reset() {
    this.cached.clear()
  }
}
