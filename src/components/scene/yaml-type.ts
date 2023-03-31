import { DEFAULT_SCHEMA, Type } from 'js-yaml'

const types = [
  /** |**  !regex
    Regex type
    @position top
    @tag It's a yaml type
    @example
    ```yaml
      - vars:
          myRegex: !regex /\d+/g        # ${ $vars.myRegex } is a RegExp type
    ```
  */
  new Type('!regex', {
    kind: 'scalar',
    resolve: function (data) {
      return data && typeof data === 'string'
    },
    instanceOf: RegExp,
    construct: function (data: string) {
      const m = data.match(/^\/(.*?)\/([a-zA-Z]*)$/)
      if (m) {
        return new RegExp(m[2], m[3] || undefined)
      }
      return new RegExp(data)
    }
  })
]
export const SPACE_SCHEMA = DEFAULT_SCHEMA.extend(types)
