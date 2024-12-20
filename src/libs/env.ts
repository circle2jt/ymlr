import merge from 'lodash.merge'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'
import { FileRemote } from './file-remote'

const ENV_LINE_PATTERN = /^\s*([^#][^=]+)\s*=\s*([^#]+)?/

export class Env {
  static ParseEnvContent(content: string, toUpperKey: boolean) {
    if (!content?.length) return {}
    return content
      .split('\n')
      .map(line => line.trim())
      .reduce((sum: Record<string, any>, line) => {
        const [key, value] = this.ParseEnvLine(line, toUpperKey)
        sum[key] = value
        return sum
      }, {})
  }

  static ParseEnvLine(urlStr: string, toUpperKey: boolean) {
    const m = urlStr.match(ENV_LINE_PATTERN)
    if (!m) {
      return [urlStr, '']
    }
    const [, key, value = ''] = m
    return [toUpperKey ? key.toUpperCase() : key, value.trim()]
  }

  static async LoadEnvToBase(proxy: ElementProxy<Element> | null, baseConfig: any, ...envFiles: Array<string | Record<string, any>>) {
    const config = {}
    for (const file of envFiles.filter(e => e)) {
      if (typeof file === 'string') {
        const env: Record<string, string> = {}
        try {
          const fileRemote = new FileRemote(file, proxy)
          if (fileRemote.existed !== false) {
            const content = await fileRemote.getTextContent()
            content.split('\n')
              .map(e => e.trim())
              .filter(e => e.length > 0)
              .forEach(e => {
                const [key, vl] = Env.ParseEnvLine(e, true)
                env[key] = vl
              })
          }
        } catch (err) {
          proxy?.logger.warn(`Could not found config file at ${file}`)
        }
        merge(config, env)
      } else {
        merge(config, Object.keys(file).reduce<Record<string, any>>((sum, e: string) => {
          sum[e.toUpperCase()] = file[e]
          return sum
        }, {}))
      }
    }
    Env.CastToObject(baseConfig, config)
    return baseConfig
  }

  private static CastToObject(obj: Record<string, any>, pro: Record<string, string>, prefix = '') {
    for (const k in obj) {
      const value = obj[k]
      if (value === null || value === undefined || typeof value === 'function') continue
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          obj[k] = value.map((itemValue: any, i: number) => this.CastToObject(itemValue, pro, prefix + k.toUpperCase() + '_' + i + '_'))
        } else if (value.constructor === Object) {
          obj[k] = this.CastToObject(value, pro, prefix + k.toUpperCase() + '_')
        }
        continue
      }
      // const lk = prefix + k.replace('.', '_').toUpperCase()
      const lk = prefix + k.toUpperCase()
      if (pro[lk] !== undefined && obj[k] !== undefined) {
        if (typeof obj[k] === 'boolean') {
          switch (pro[lk]) {
            case 'true':
            case '1':
            case 'yes':
              obj[k] = true
              break
            case 'false':
            case '0':
            case 'no':
              obj[k] = false
              break
            default:
              obj[k] = !!pro[lk]
              break
          }
        } else if (typeof obj[k] === 'number') {
          obj[k] = +pro[lk]
        } else if (obj[k] instanceof Date) {
          const timestamp = +pro[lk]
          if (!isNaN(timestamp)) {
            obj[k] = new Date(timestamp)
          } else {
            obj[k] = Date.parse(pro[lk])
          }
        } else {
          obj[k] = pro[lk]
        }
      }
    }
    return obj
  }
}
