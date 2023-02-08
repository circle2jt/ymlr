import chalk from 'chalk'
import { decode, encode } from 'querystring'
import { formatTextToMs } from 'src/libs/format'
import { ElementShadow } from '../element-shadow'
import { HeadProps } from './head.props'
import { HttpError } from './http-error'
import { Response } from './types'

/** |**  http'head
  Send a http request with HEAD method
  @example
  ```yaml
    # HEAD http://localhost:3000/posts/1?method=check_existed
    - http'head:
        title: Check post is existed or not
        baseURL: http://localhost:
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
                                        # supported: d h m s ~ day, hour, minute, seconds
                                        # example: 1h2m3s ~ 1 hour, 2 minutes, 3 seconds
        url: /posts/1
        query:
          method: check_existed
        headers:
          authorization: Bearer TOKEN
        vars:
          status: ${this.response?.status}
  ```
*/
export class Head extends ElementShadow {
  $$ignoreEvalProps = ['response', 'executionTime', 'error', 'abortController', 'method', 'fullURL', 'fullURLQuery']

  method = 'head'
  baseURL?: string
  timeout?: number | string
  url = ''
  headers = {} as any
  query?: any
  response?: Response
  executionTime?: number

  private abortController?: AbortController

  protected get fullURL() {
    return `${this.baseURL || ''}${this.url}`
  }

  protected get fullURLQuery() {
    return this.fullURL + (this.query ? `?${encode(this.query)}` : '')
  }

  constructor(props: HeadProps) {
    super()
    Object.assign(this, props)
  }

  abort() {
    this.abortController?.abort()
  }

  async exec() {
    try {
      this.logger.debugBlock(true)
      this.logger.debug('%s \t%s', chalk.gray(`⇾ ${this.method.toUpperCase()}`), this.fullURL)

      this.prehandleQuery()
      this.prehandleHeaders()
      const before = Date.now()
      if (!this.response) {
        this.abortController = new AbortController()
        const proms: Array<Promise<null | Response>> = [
          this.send({ signal: this.abortController.signal })
        ]
        let tm: NodeJS.Timeout | undefined
        if (this.timeout) {
          this.timeout = formatTextToMs(this.timeout)
          proms.push(new Promise<null>((resolve) => {
            tm = setTimeout(() => resolve(null), this.timeout as number)
          }))
        }
        const rs = await Promise.race<any>(proms)
        if (rs === null) {
          // Timeout
          this.abort()
          throw new HttpError(408, `Request timeout >= ${this.timeout}ms`)
        } else if (tm) {
          // success/error
          clearTimeout(tm)
        }
      } else {
        const isGotData = this.response.data !== null && this.response.data !== undefined
        this.response.status = isGotData ? 200 : 204
        this.response.ok = this.response.status >= 200 && this.response.status < 300
        // await this.handleCustomResponse()
      }
      this.executionTime = Date.now() - before
      this.prehandleResponseHeaders()
      this.prehandleResponseData()
      if (!this.response?.ok) throw new HttpError(this.response?.status, this.response?.statusText, this.response?.data)
    } catch (err: any) {
      this.error = err instanceof HttpError ? err : new HttpError(0, err?.message)
    } finally {
      this.vars && this.applyVar()
      this.logger.debugBlock(false)
    }
    if (this.error) {
      if (this.error.status >= 500 || !this.error.status || this.error.status === 408) throw this.error
      this.logger.error(this.error)
    }
    return this.response?.data
  }

  // protected async handleCustomResponse() { }

  async send(fetchOpts: any = {}) {
    this.prehandleHeaders()
    const rs = await fetch(this.fullURLQuery, {
      method: this.method,
      headers: this.headers,
      ...fetchOpts
    })
    this.response = {
      ok: rs.ok,
      headers: this.getResponseHeader(rs),
      status: rs.status,
      statusText: rs.statusText
    }
    return this.response
  }

  protected applyVar() {
    if (!this.vars) return
    let varNames: string
    if (typeof this.vars === 'string') {
      varNames = this.vars
    } else {
      varNames = Object.keys(this.vars).map(v => `${v}`).join(', ')
    }
    this.logger.debug('%s   \t%s', chalk.gray('‣ Vars'), varNames)
  }

  protected checkEmpty(vl: any) {
    if (!vl) return undefined
    if (Array.isArray(vl) && !vl.length) return undefined
    if (typeof vl === 'object' && !Object.keys(vl).length) return undefined
    return vl
  }

  protected setHeader(key: string, value: any) {
    if (!this.headers) this.headers = {}
    if (!this.headers[key]) this.headers[key] = value
  }

  protected getResponseHeader(rs: Response) {
    const headers = Array.from<string>(rs.headers.entries())
    if (!headers.length) return undefined
    return headers.reduce<Record<string, any>>((sum, [key, vl]) => {
      sum[key] = vl
      return sum
    }, {})
  }

  protected prehandleResponseHeaders() {
    if (!this.response) return
    const color = this.response.status ? chalk.green : chalk.red
    const icon = this.response.status ? '☑' : '☒'
    this.logger.debug(`${color(`${icon} %d %s`)} \t%s`, this.response.status, this.response.statusText || '', chalk.gray(`${this.executionTime}ms`))
    if (this.response.headers) {
      this.response.headers = this.checkEmpty(this.response.headers)
      this.response.headers && this.logger.debug('%s\t%j', chalk.gray('⇽ Headers'), this.response.headers)
    }
  }

  protected prehandleResponseData() {
    if (!this.response) return
    this.response.data && this.logger.debug('%s   \t%j', chalk.gray('⇽ Data'), this.response.data)
  }

  protected prehandleHeaders() {
    this.headers = this.checkEmpty(this.headers)
    this.headers && this.logger.debug('%s\t%j', chalk.gray('⇾ Headers'), this.headers)
  }

  protected prehandleQuery() {
    const [url, queryString] = this.url.split('?')
    this.url = url
    if (queryString) {
      if (!this.query) this.query = {}
      const query = decode(queryString)
      Object.assign(this.query, query)
    }
    this.query = this.checkEmpty(this.query)
    this.query && this.logger.debug('%s  \t%j', chalk.gray('⇾ Query'), this.query)
  }
}
