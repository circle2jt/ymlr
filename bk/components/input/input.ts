import assert from 'assert'
import { ElementShadow } from '../element-shadow'
import { InputInterface } from './input.interface'
import { InputProps } from './input.props'
import { InputAbstract } from './questions/input.abstract'

export class Input<T extends InputProps> extends ElementShadow {
  $$ignoreEvalProps = ['input', 'InputClass']

  props: any

  private input?: InputAbstract<InputInterface>
  protected InputClass?: new (props: any) => InputAbstract<InputInterface>

  constructor(inputProps: T) {
    super()
    const { vars, title: label, ...props } = inputProps
    Object.assign(this, {
      vars,
      props: { label, ...props }
    })
  }

  answer(value?: string | number | boolean | Array<{ key: string, name: string }>) {
    return this.input?.answer(value)
  }

  async exec() {
    assert(!!this.InputClass)
    globalThis.inputIndent = this.logger.indentString
    this.input = new this.InputClass(this.props)
    const value = await this.input.exec()
    if (value === undefined) {
      process.exit(0)
    }
    return value
  }
}
