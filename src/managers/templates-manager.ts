
export class TemplatesManager {
  cached: Record<string, any> = {}

  pushToCached(name: string, props: any) {
    this.cached[name] = props
  }

  getFromCached(name: string) {
    return this.cached[name]
  }

  reset() {
    this.cached = {}
  }
}
