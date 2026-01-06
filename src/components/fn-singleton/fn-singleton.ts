import assert from 'assert'
import { singleton } from 'src/libs/singleton-function'
import { SingletonManager } from 'src/managers/singleton-manager'
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
        singletonData:              # Pass input data to singleton to do async task
          dataFromParentState: ${ $ps.channelData.name }
      runs:
        - echo: Do this when it's free for 1s
  ```
*/
export class FNSingleton implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>
  get logger() {
    return this.proxy.logger
  }

  overrideProxyProps() {
    return {
      detach: true
    }
  }

  name!: string
  trailing?: boolean
  autoRemove?: boolean
  singletonData?: any
  // eslint-disable-next-line @typescript-eslint/ban-types
  private fn?: Function & { cancel: () => void, onDone?: () => any }
  private promsise?: {
    t: Promise<any>
    resolve: (value?: any) => void
    reject: (reason?: any) => void
  }

  constructor(props: any) {
    Object.assign(this, props)
  }

  async exec() {
    assert(this.name?.length, 'name is required')

    if (SingletonManager.Instance.has(this.name)) {
      SingletonManager.Instance.touch(this.name, this.singletonData)
      return
    }
    assert(this.proxy.runs, 'runs is required')

    this.logger.trace('%s: create a new one', this.name)

    const promsise = {
      t: undefined,
      resolve: (_value?: any) => { },
      reject: (_reason?: any) => { }
    }
    const t = new Promise<any>((resolve, reject) => {
      promsise.resolve = resolve
      promsise.reject = reject
    })
    promsise.t = t as any
    this.promsise = promsise as any

    this.fn = singleton(async (singletonData) => {
      try {
        await this.innerRunsProxy.exec({
          singletonData
        })
      } catch (err) {
        this.promsise?.reject(err)
      }
    }, {
      trailing: this.trailing
    })
    if (this.autoRemove) {
      this.fn.onDone = () => {
        this.remove()
      }
    }
    SingletonManager.Instance.set(this.name, this)
    this.touch(this.singletonData)
    await this.promsise?.t
  }

  touch(singleData?: any) {
    if (!this.fn) return
    this.logger.trace('%s: touch', this.name)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setImmediate(async () => {
      try {
        await this.fn?.(singleData)
      } catch (err) {
        this.promsise?.reject(err)
      }
    })
  }

  cancel() {
    if (!this.fn) return
    this.logger.trace('%s: cancel', this.name)
    this.fn?.cancel()
  }

  remove() {
    if (!this.fn) return
    this.logger.trace('%s: remove', this.name)
    SingletonManager.Instance.delete(this.name)
    this.cancel()
    this.singletonData = undefined
    this.promsise?.resolve()
  }

  async dispose() {
    if (!this.fn) return
    this.logger.trace('%s: dispose', this.name)
    this.remove()
    await this.innerRunsProxy.dispose()
    this.promsise = undefined
    this.fn = undefined
  }
}
