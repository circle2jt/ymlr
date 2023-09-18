import chalk from 'chalk'
import { stdin } from 'process'
import prompts, { type Answers, type PromptType } from 'prompts'
// @ts-expect-error Missed ".d.ts" file
import figures from 'prompts/lib/util/figures'
// @ts-expect-error Missed ".d.ts" file
import styles from 'prompts/lib/util/style'
import { type InputInterface } from '../input.interface'

const symbols = Object.freeze({
  get aborted() {
    return chalk.red((globalThis.inputIndent || '') + (figures.cross as string))
  },
  get done() {
    return chalk.green((globalThis.inputIndent || '') + (figures.tick as string))
  },
  get exited() {
    return chalk.yellow((globalThis.inputIndent || '') + (figures.cross as string))
  },
  get default() {
    return chalk.cyan((globalThis.inputIndent || '') + '?')
  }
})

styles.symbol = (done: any, aborted: any, exited: any) => {
  return aborted ? symbols.aborted : exited ? symbols.exited : done ? symbols.done : symbols.default
}

export abstract class InputAbstract<T extends InputInterface> implements InputInterface {
  type?: PromptType
  label?: string
  default?: any
  required?: boolean

  question?: Answers<any>

  constructor(props: Partial<T>) {
    Object.assign(this, props)
  }

  async exec(opts?: any) {
    const { type, default: initial, label: message, question, ...moreOpts } = this
    this.question = await prompts({
      type,
      name: 'value',
      initial,
      message,
      ...moreOpts,
      ...opts
    })
    return this.question.value
  }

  answer(value?: string | number | boolean | Array<{ key: string, name: string }>) {
    if (value) {
      let keys = []
      if (Array.isArray(value)) {
        keys = value
      } else {
        keys = value.toString().split('').map(k => {
          return { key: k, name: k }
        })
      }
      keys.forEach(({ key, name }) => {
        stdin.emit('keypress', key, { name })
      })
    }
    stdin.emit('keypress', '\r', {
      name: 'return'
    })
  }
}
