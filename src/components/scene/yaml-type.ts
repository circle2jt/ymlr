import { DEFAULT_SCHEMA, Type } from 'js-yaml'
import { Scene } from './scene'

export class YamlType {
  private readonly types = [
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
    // new Type('!load', {
    //   kind: 'scalar',
    //   resolve: function (path: string) {
    //     return !!path
    //   },
    //   instanceOf: String,
    //   construct: (path: string) => {
    //     const f = new FileRemote(path, this.scene)
    //     const content = readFileSync(f.uri).toString()
    //     return content
    //   }
    // })
  ]

  get spaceSchema() {
    return DEFAULT_SCHEMA.extend(this.types)
  }

  constructor(public readonly scene: Scene) { }
}
