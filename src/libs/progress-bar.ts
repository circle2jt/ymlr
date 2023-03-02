import { Ora } from 'ora'
import { loadESModule } from 'src/managers/modules-manager'
import { Logger, LoggerLevel } from './logger'

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

  private maxLength = 0
  private spinner?: Ora

  constructor(public logger: Logger) {

  }

  async start(txt: string) {
    if (txt.length > this.maxLength) this.maxLength = txt.length
    const { default: ora } = await loadESModule('ora')
    this.spinner = ora({
      text: txt,
      indent: this.logger.indent * 2,
      color: 'gray'
    })
    this.spinner?.start()
  }

  update(txt: string, level?: LoggerLevel) {
    if (txt.length > this.maxLength) this.maxLength = txt.length
    if (this.spinner) this.spinner.text = this.logger.formatWithoutIndent(txt, level)
  }

  async stop() {
    this.update(new Array(this.maxLength).fill(' ').join(''))
    // this.spinner?.clear()
    this.spinner?.stop()
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
