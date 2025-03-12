import assert from 'assert'
import { singleton } from 'src/libs/singleton-function'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'

/** |**  fn-singleton
  This is locked before run and unlock after done. When it's called many time, this is only run after unlock
  @order 6
  @example
  ```yaml
    - fn-singleton:
        name: Only run 1 time
        trailing: true              # In the processing which not finished yet, if it's called by others, it keeps the last params to cached then make the last call before done
        autoRemove: true            # Auto remove after done
      runs:
        - echo: Do this when it's free for 1s
  ```
*/
export class FNSingleton implements Element {
  static readonly Caches = new Map<string, (parentState?: Record<string, any>) => any>()

  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  name!: string
  trailing?: boolean
  autoRemove?: boolean

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec(parentState?: Record<string, any>) {
    assert(this.name)

    let fn = FNSingleton.Caches.get(this.name)
    if (!fn) {
      fn = singleton(async (parentState?: Record<string, any>) => {
        await this.innerRunsProxy.exec(parentState)
      }, {
        trailing: this.trailing
      })
      if (this.autoRemove) {
        (fn as any).onDone = () => {
          FNSingleton.Caches.delete(this.name)
        }
      }
      FNSingleton.Caches.set(this.name, fn)
    }
    const rs = await fn(parentState)
    return rs
  }

  dispose() { }
}
