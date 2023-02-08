import Spinnies from 'spinnies'
import { Logger, LoggerLevel } from './logger'
import { sleep } from './time'

const spinnies = new Spinnies()

export class ProgressBar {
  static readonly Color = {
    Black: 'black',
    Red: 'red',
    Green: 'green',
    Yellow: 'yellow',
    Blue: 'blue',
    Magenta: 'magenta',
    Cyan: 'cyan',
    White: 'white',
    Gray: 'gray'
  }

  private readonly id = `${Date.now()}-${Math.random()}`
  private maxLength = 0

  constructor(public logger: Logger, private readonly color = ProgressBar.Color.Cyan) {

  }

  async start(txt: string) {
    if (txt.length > this.maxLength) this.maxLength = txt.length
    spinnies.add(this.id, {
      text: txt,
      indent: this.logger.indent * 2,
      color: this.color as any
    })
  }

  update(txt: string, level?: LoggerLevel) {
    if (txt.length > this.maxLength) this.maxLength = txt.length
    spinnies.update(this.id, {
      text: this.logger.formatWithoutIndent(txt, level)
    })
  }

  async stop() {
    this.update(new Array(this.maxLength).fill(' ').join(''))
    await sleep(100)
    spinnies.remove(this.id)
  }

  async passed(txt: string, ...args: string[]) {
    await this.stop()
    this.logger.info(txt, ...args)
  }

  async failed(txt: string, ...args: string[]) {
    await this.stop()
    this.logger.error(txt, ...args)
  }
}
