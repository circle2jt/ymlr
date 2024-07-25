import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type TagRegisterProps } from './tag-register.props'

/** |**  tag'register
  Register custom tags from code or npm module, github....
  @example
  Register custom tags from a file
  ```yaml
    - tag'register:
        test1: /workspaces/ymlr/test/resources/test.js       # { tagName: pathOfModule }

    - test1:
        foo: bar
  ```

  Register custom tags from an object
  ```yaml
    - tag'register:
        newOne: |
          {
            constructor(props) {
              Object.assign(this, props)
            },
            async asyncConstructor(props) {
              // Do async job to init data
            },
            exec() {
              this.logger.info('ok ' + this.name, this.tag)
            },
            dispose() {
              // Dispose after finished this
            }
          }

    - newOne:
        name: foo
  ```

  Register custom tags from a class
  ```yaml
    - tag'register:
        newOne: |
          class {
            constructor(props) {
              Object.assign(this, props)
            }
            async asyncConstructor(props) {
              // Do async job to init data
            }
            exec() {
              this.logger.info('ok ' + this.name, this.tag)
            }
            dispose() {
              // Dispose after finished this
            }
          }

    - newOne:
        name: foo
  ```
*/
export class TagRegister implements Element {
  readonly proxy!: ElementProxy<this>

  private get tagsManager() { return this.proxy.rootScene.tagsManager }
  private get logger() { return this.proxy.logger }

  tags?: Record<string, string>

  constructor(tags: TagRegisterProps) {
    Object.assign(this, { tags })
  }

  async exec() {
    const tagNames = this.tags && Object.keys(this.tags)
    if (!tagNames?.length) return
    await Promise.all(Object.keys(this.tags || {})
      .map(async key => {
        const pathOrContent = this.tags?.[key] || ''
        if (pathOrContent.split('\n').length === 1) {
          // handle path of module
          this.logger.trace('Loaded tags \t[%s] %s', key, pathOrContent)
          this.tagsManager.register(key, pathOrContent)
        } else {
          // handle code
          try {
            const tagScript = this.tags?.[key]
            const obj = await this.proxy.callFunctionScript(`return (${tagScript})`)
            this.logger.trace('Register tag \t[%s]', obj.tag)
            this.tagsManager.setTag(key, { default: obj })
          } catch (err) {
            this.logger.error(`Register a custom tag "${key}" error`)
            throw err
          }
        }
      })
    )
  }

  dispose() { }
}
