import assert from 'assert'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type InputInterface } from './input.interface'
import { type InputProps } from './input.props'
import { type InputAbstract } from './questions/input.abstract'

export class Input<T extends InputProps> implements Element {
  readonly ignoreEvalProps = ['InputClass']
  readonly proxy!: ElementProxy<this>

  private get logger() { return this.proxy.logger as any }

  props: any

  protected InputClass?: new (props: any) => InputAbstract<InputInterface>

  #input?: InputAbstract<InputInterface>

  constructor(inputProps: T) {
    const { vars, title: label, ...props } = inputProps
    Object.assign(this, {
      vars,
      props: { label, ...props }
    })
  }

  answer(value?: string | number | boolean | Array<{ key: string, name: string }>) {
    return this.#input?.answer(value)
  }

  async exec() {
    assert(!!this.InputClass)
    globalThis.inputIndent = this.logger.indent?.indentString || ''
    this.#input = new this.InputClass(this.props)
    const value = await this.#input.exec()
    if (value === undefined) {
      process.exit(0)
    }
    return value
  }

  dispose() { }
}
