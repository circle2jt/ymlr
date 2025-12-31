import chalk from 'chalk'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'
import { RootScene } from 'src/components/root-scene'
import { formatDuration } from 'src/libs/format'
import { GlobalEvent } from 'src/libs/global-event'
import { type Logger } from 'src/libs/logger'
import { sleep } from 'src/libs/time'

export class Summary {
  private readonly logger: Logger
  private readonly count = {
    allExec: 0,
    done: 0,
    failed: 0,
    allDispose: 0
  }

  private readonly time = {
    execution: 0
  }

  constructor(private readonly rootSceneProxy: ElementProxy<RootScene>) {
    this.logger = this.rootSceneProxy.logger.clone('Summary')
    GlobalEvent
      .on('@elementProxy:exec.0', (proxy: ElementProxy<Element>) => {
        if (this.time.execution) {
          ++this.count.allExec
          return
        }
        if (proxy.$ instanceof RootScene) {
          this.time.execution = Date.now()
        }
      })
      .on('@elementProxy:exec.1', (proxy: ElementProxy<Element>, err?: Error) => {
        if (!(proxy.$ instanceof RootScene)) {
          err ? ++this.count.failed : ++this.count.done
        }
      })
      .on('@elementProxy:dispose.1', (proxy: ElementProxy<Element>) => {
        if (!(proxy.$ instanceof RootScene)) {
          ++this.count.allDispose
          return
        }
        this.time.execution = Date.now() - this.time.execution
      })
  }

  async print() {
    await sleep(500)
    this.logger.info(chalk.gray('»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»'))
    this.logger.info('%s\t%s', 'Duration', `${formatDuration(this.time.execution)}`)
    this.logger.info('%s\t%s', 'Runs    ', `${this.count.allExec}(steps)`)
    this.logger.info(chalk.gray('          \t ↳ %s\t%s/%d'), 'done  ', chalk.green(this.count.done), this.count.allExec)
    this.logger.info(chalk.gray('          \t ↳ %s\t%s/%d'), 'failed', chalk.red(this.count.failed), this.count.allExec)
    this.logger.info(chalk.gray('          \t ↳ %s\t%s/%d'), 'disposed', chalk.yellow(this.count.allDispose), this.count.allExec)
    this.logger.info(chalk.gray('«««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««'))
  }
}
