import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'

/** |**  scene'returns
  Return value to parent scene
  @example
  Scene `sum.yaml`
  ```yaml
    vars:
      x: 0
      y: 0
    runs:
      - vars:
          result: ${ $vars.x + $vars.y }

      - scene'returns: ${ $vars.result }
  ```
  Main scene `index.yaml`
  ```yaml
    - name: Load a scene to sum 2 digits
      scene:
        path: .../sum.yaml
        vars:
          x: 10
          y: 20
      vars: sumOfXY

    - echo: ${ $vars.sumOfXY }    # => 30
  ```
*/
export class Returns implements Element {
  ignoreEvalProps = ['result', 'props']
  proxy!: ElementProxy<this>
  get logger() {
    return this.proxy.logger
  }

  result?: any

  constructor(private readonly props: any) { }

  async exec() {
    this.result = await this.proxy.scene.getVars(this.props, this.proxy)
    this.logger.trace('[%s] \t%j', this.proxy.tag, this.result)
    this.proxy.scene.proxy.result = this
  }

  dispose() { }
}
