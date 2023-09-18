import { readFileSync, statSync } from 'fs'
import merge from 'lodash.merge'
import { type Logger } from './logger'

export class Env {
  constructor(private readonly logger: Logger) { }

  async loadEnvToBase(baseConfig: any, ...envFiles: Array<string | Record<string, any>>) {
    const config = {}
    for (const file of envFiles.filter(e => e)) {
      if (typeof file === 'string') {
        const env: Record<string, string> = {}
        try {
          if (file && statSync(file)) {
            const content = readFileSync(file).toString('utf8')
            content.split('\n')
              .map(e => e.trim())
              .filter(e => e && !e.startsWith('#'))
              .forEach(e => {
                const [key, vl] = this.parseEnvLine(e)
                env[key.trim().toUpperCase()] = vl.trim()
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
      if (typeof obj[k] === 'function') continue
      if (typeof obj[k] === 'object') {
        obj[k] = this.castToObject(obj[k], pro, (prefix + k + '_').toUpperCase())
      } else if (Array.isArray(obj[k])) {
        for (const i in obj[k]) {
          obj[k][i] = this.castToObject(obj[k][i], pro, (prefix + k + '_' + i + '_').toUpperCase())
        }
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

  private parseEnvLine(urlStr: string) {
    const idx = urlStr.indexOf('=')
    if (idx === -1) return [urlStr, '']
    const first = urlStr.substring(0, idx)
    const second = urlStr.substring(idx + 1)
    return [first, second]
  }
}
