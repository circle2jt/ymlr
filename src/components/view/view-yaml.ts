import { stringify } from 'yaml'
import { View } from './view'
import { ViewYamlProps } from './view-yaml.props'

/** |**  view'yaml
  View data in a yaml format
  @example
  ```yaml
    - view'yaml:
        title: Yaml Viewer
        data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

    - view'yaml: ${vars.TEST_DATA}
  ```
*/
export class ViewYaml extends View {
  constructor(props: ViewYamlProps) {
    super(props)
  }

  print() {
    this.logger.addIndent()
    try {
      this.logger.log(stringify(this.data, { indent: 2 }))
    } finally {
      this.logger.removeIndent()
    }
  }
}
