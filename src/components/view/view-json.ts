import { View } from './view'
import { ViewJsonProps } from './view-json.props'

/** |**  view'json
  View data in a json format
  @example
  ```yaml
    - view'json:
        title: JSON Viewer
        data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

    - view'json: ${vars.TEST_DATA}
  ```
*/
export class ViewJson extends View {
  constructor(props: ViewJsonProps) {
    super(props)
  }

  print() {
    this.logger.addIndent()
    try {
      this.logger.log(JSON.stringify(this.data, null, '  '))
    } finally {
      this.logger.removeIndent()
    }
  }
}
