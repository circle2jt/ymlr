import { dump } from 'js-yaml'
import { View } from './view'
import { ViewYamlProps } from './view-yaml.props'

/** |**  view'yaml
  View data in a yaml format
  @example
  ```yaml
    - view'yaml:
        name: Yaml Viewer
        data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

    - view'yaml: ${$vars.TEST_DATA}
  ```
*/
export class ViewYaml extends View {
  constructor(props: ViewYamlProps) {
    super(props)
  }

  print() {
    this.logger.addIndent()
    try {
      this.logger.log(dump(this.data, { indent: 2 }))
    } finally {
      this.logger.removeIndent()
    }
  }
}
