import chalk from 'chalk'
import { LoggerLevel } from 'src/libs/logger'
import { format } from 'util'
import { ElementShadow } from '../element-shadow'
import { ViewProps } from './view.props'

/** |**  view
  View data in a pretty format
  @example
  ```yaml
    - name: Pretty Viewer
      view:
        data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

    - view: ${vars.TEST_DATA}
  ```
*/
export class View extends ElementShadow {
  data: any

  constructor(props: ViewProps) {
    super()
    if (typeof props !== 'object') {
      props = {
        data: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    if (this.logger.is(LoggerLevel.INFO) && this.data) {
      this.print()
    }
    return this.data
  }

  private chalkByType(o: any, str: string) {
    const type = typeof o
    if (type === 'string') return chalk.yellow(str)
    if (type === 'boolean') return chalk.red(str)
    if (type === 'number') return chalk.green(str)
    if (Array.isArray(o)) return chalk.blue(str)
    if (type === 'object') return chalk.cyan(str)
    return chalk.white.dim(str)
  }

  private prettyFormat(obj: any) {
    if (!obj || typeof obj !== 'object') return format(obj)
    if (Array.isArray(obj)) {
      obj.forEach((o, i) => {
        const key = this.chalkByType(o, '[%d]')
        if (typeof o === 'object') {
          this.logger.log(`${key}: `, i)
          this.logger.addIndent()
          try {
            this.prettyFormat(o)
          } finally {
            this.logger.removeIndent()
          }
        } else {
          this.logger.log(`${key}: %j`, i, o)
        }
      })
    } else {
      for (const k in obj) {
        const o = obj[k]
        const key = this.chalkByType(o, '%s')
        if (typeof o === 'object') {
          this.logger.log(`${key}: `, k)
          this.logger.addIndent()
          try {
            this.prettyFormat(o)
          } finally {
            this.logger.removeIndent()
          }
        } else {
          this.logger.log(`${key}: %j`, k, o)
        }
      }
    }
  }

  print() {
    this.logger.addIndent()
    try {
      this.format(this.data)
    } finally {
      this.logger.removeIndent()
    }
  }

  private format(data: any) {
    this.prettyFormat(data)
  }
}
