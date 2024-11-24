import merge from 'lodash.merge'
import { type Scene } from 'src/components/scene/scene'
import { FileRemote } from './file-remote'
import { type Logger } from './logger'

const ENV_LINE_PATTERN = /^\s*([^#][^=]+)\s*=\s*([^#]+)?/

export class Env {
  static ParseEnvLine(urlStr: string, toUpperKey: boolean) {
    const m = urlStr.match(ENV_LINE_PATTERN)
    if (!m) {
      return [urlStr, '']
    }
    const [, key, value = ''] = m
    return [toUpperKey ? key.toUpperCase() : key, value.trim()]
  }

  constructor(private readonly logger: Logger) { }

  async loadEnvToBase(scene: Scene | null, baseConfig: any, ...envFiles: Array<string | Record<string, any>>) {
    const config = {}
    for (const file of envFiles.filter(e => e)) {
      if (typeof file === 'string') {
        const env: Record<string, string> = {}
        try {
          const fileRemote = new FileRemote(file, scene)
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
          this.logger.warn(`Could not found config file at ${file}`)
        }
        merge(config, env)
      } else {
        merge(config, Object.keys(file).reduce<Record<string, any>>((sum, e: string) => {
          sum[e.toUpperCase()] = file[e]
          return sum
        }, {}))
      }
    }
    this.castToObject(baseConfig, config)
    return baseConfig
  }

  private castToObject(obj: Record<string, any>, pro: Record<string, any>, prefix = '') {
    for (const k in obj) {
      const value = obj[k]
      if (typeof value === 'function') continue
      if (typeof value === 'object') {
        if (value === null || value === undefined) continue
        if (Array.isArray(value)) {
          obj[k] = value.map((itemValue: any, i: number) => this.castToObject(itemValue, pro, (prefix + k + '_' + i + '_').toUpperCase()))
        } else if (value.constructor === Object) {
          obj[k] = this.castToObject(value, pro, (prefix + k + '_').toUpperCase())
        }
        continue
      } else {
        const lk = prefix + k.toUpperCase().replace('.', '_')
        if (pro[lk] !== undefined && obj[k] !== undefined) {
          if (typeof obj[k] === 'boolean') {
            switch (pro[lk]) {
              case 'true':
                obj[k] = true
                break
              case '1':
                obj[k] = true
                break
              case 'yes':
                obj[k] = true
                break
              case 'false':
                obj[k] = false
                break
              case '0':
                obj[k] = false
                break
              case 'no':
                obj[k] = false
                break
              default:
                obj[k] = !!pro[lk]
                break
            }
          } else if (typeof obj[k] === 'number') {
            obj[k] = +pro[lk]
          } else {
            obj[k] = pro[lk]
          }
        }
      }
    }
    return obj
  }
}
