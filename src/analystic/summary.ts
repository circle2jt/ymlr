import chalk from 'chalk'
import { ElementProxy } from 'src/components/element-proxy'
import { RootScene } from 'src/components/root-scene'
import { formatDuration } from 'src/libs/format'

export class Summary {
  private get logger() {
    return this.rootSceneProxy.logger
  }

  private readonly count = {
    exec: 0,
    dispose: 0
  }

  private readonly time = {
    exec: 0,
    dispose: 0,
    execution: 0
  }

  constructor(private readonly rootSceneProxy: ElementProxy<RootScene>) {
    this.rootSceneProxy.$.event
      .on('element/exec:before', () => {
        this.count.exec++
      })
      .on('element/dispose', () => {
        this.count.dispose++
      })
      .on('scene/exec:before', () => {
        this.time.exec = Date.now()
      })
      .on('scene/exec:end', () => {
        this.time.exec = Date.now() - this.time.exec
      })
      .on('scene/dispose:before', () => {
        this.time.dispose = Date.now()
      })
      .on('scene/dispose:end', () => {
        this.time.dispose = Date.now() - this.time.dispose
      })
  }

  print() {
    this.logger.log('')
    this.logger.log(chalk.gray('»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»'))
    this.logger.log('%s\t%s', 'Runs    ', `${this.count.exec}(items)`)
    this.logger.log('%s\t%s', 'Duration', `${formatDuration(Date.now() - this.time.execution)}`)
    this.logger.log(chalk.gray('          \t ↳ %s\t%d(items) in %s'), 'execute', this.count.exec, formatDuration(this.time.exec))
    this.logger.log(chalk.gray('          \t ↳ %s\t%d(items) in %s'), 'dispose', this.count.dispose, formatDuration(this.time.dispose))
    this.logger.log(chalk.gray('«««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««««'))
  }
}
