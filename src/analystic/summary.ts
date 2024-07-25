import chalk from 'chalk'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'
import { RootScene } from 'src/components/root-scene'
import { formatDuration } from 'src/libs/format'
import { GlobalEvent } from 'src/libs/global-event'
import { type Logger } from 'src/libs/logger'

export class Summary {
  readonly #logger: Logger

  readonly #count = {
    exec: 0,
    dispose: 0
  }

  readonly #time = {
    execution: 0
  }

  constructor(private readonly rootSceneProxy: ElementProxy<RootScene>) {
    this.#logger = this.rootSceneProxy.logger.clone('Summary')
    GlobalEvent
      .on('@app/proxy/before:exec:exec', (proxy: ElementProxy<Element>) => {
        if (proxy instanceof RootScene) {
          this.#time.execution = Date.now()
        } else {
          this.#count.exec++
        }
      })
      .on('@app/proxy/after:dispose', (proxy: ElementProxy<Element>) => {
        if (proxy instanceof RootScene) {
          this.#time.execution = Date.now() - this.#time.execution
        } else {
          this.#count.dispose++
        }
      })
  }

  print() {
    this.#logger.debug(chalk.gray('»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»'))
    this.#logger.debug('%s\t%s', 'Duration', `${formatDuration(this.#time.execution)}`)
    this.#logger.debug('%s\t%s', 'Runs    ', `${this.#count.exec}(items)`)
    this.#logger.debug(chalk.gray('          \t ↳ %s\t%d(items)'), 'executed', this.#count.exec)
    this.#logger.debug(chalk.gray('          \t ↳ %s\t%d(items)'), 'disposed', this.#count.dispose)
    this.#logger.debug(chalk.gray('«««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««'))
  }
}
