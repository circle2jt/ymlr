import { View } from './view'
import { ViewTableProps } from './view-table.props'

/** |**  view'table
  View data in a table format
  @example
  ```yaml
    - view'table:
        title: Table viewer
        headers:            # Pick some headers to show. Default is all
          - name
          - age
        data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

    - view'table: ${vars.TEST_DATA}
  ```
*/
export class ViewTable extends View {
  headers?: string[]

  constructor(eprops: ViewTableProps) {
    if (typeof eprops === 'object') {
      const { headers, ...props } = eprops
      super(props)
      Object.assign(this, { headers })
    } else {
      super(eprops)
    }
  }

  print() {
    const arr = new Array(this.logger.indent).fill(null)
    arr.forEach(() => console.group())
    console.table(this.data, this.headers)
    arr.forEach(() => console.groupEnd())
  }
}
