import chalk from 'chalk'
import { decode, encode } from 'querystring'
import { formatTextToMs } from 'src/libs/format'
import { setTimeout } from 'timers/promises'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type HeadProps } from './head.props'
import { HttpError } from './http-error'

/** |**  fetch'head
  Send a http request with HEAD method
  @example
  ```yaml
    # HEAD http://localhost:3000/posts/1?method=check_existed
    - name: Check post is existed or not
      fetch'head:
        baseURL: http://localhost:
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
                                        # supported: d h m s ~ day, hour, minute, seconds
                                        # example: 1h2m3s ~ 1 hour, 2 minutes, 3 seconds
        url: /posts/1
        query:
          method: check_existed
        headers:
          authorization: Bearer TOKEN
        validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
      vars:
        status: ${this.response?.status}
  ```
*/
export class Head implements Element {
  readonly ignoreEvalProps = ['response', 'executionTime']
  readonly proxy!: ElementProxy<this>

  protected get logger() { return this.proxy.logger }

  method = 'head'
  baseURL?: string
  timeout?: number | string
  url = ''
  headers: Record<string, any> = {}
  query?: any
  opts?: RequestInit
  validStatus?: number[]

  response?: any
  executionTime?: number

  protected readonly _abortController = new AbortController()

  protected get fullURL() {
    return `${this.baseURL || ''}${this.url}`
  }

  protected get fullURLQuery() {
    return this.fullURL + (this.query ? `?${encode(this.query)}` : '')
  }

  protected get fetchOpts() {
    const opts: RequestInit = {
      method: this.method,
      headers: this.headers,
      signal: this._abortController.signal,
      ...this.opts
    }
    return opts
  }

  constructor(props: HeadProps) {
    Object.assign(this, props)
  }

  abort() {
    this._abortController.abort()
  }

  async exec() {
    try {
      this.logger.debug('%s \t%s', chalk.gray(`⇾ ${this.method.toUpperCase()}`), this.fullURL)

      this.prehandleQuery()
      this.prehandleHeaders()
      const before = Date.now()
      if (!this.response) {
        if (this.timeout) {
          const [resp] = await Promise.race([
            this.send(),
            setTimeout(formatTextToMs(this.timeout))
          ])
          if (!resp) {
            this.abort()
            throw new HttpError(408, 'Request is timeout')
          }
        } else {
          await this.send()
        }
        if (this.response?.ok === false) {
          if (!this.validStatus?.includes(this.response.status)) {
            throw new HttpError(this.response.status, this.response.statusText)
          }
          this.response.ok = true
        }
      } else {
        const isGotData = this.response.data !== null && this.response.data !== undefined
        this.response.status = isGotData ? 200 : 204
        if (!this.response.headers) this.response.headers = {}
        if (!this.response.headers['content-type']) this.response.headers['content-type'] = 'application/json'
      }
      this.executionTime = Date.now() - before
      this.prehandleResponseHeaders()
      this.prehandleResponseData()
    } catch (err: any) {
      if (err.response?.status !== undefined) {
        if (!this.response) this.response = {}
        this.response.status = err.response?.status
        this.response.statusText = err.response?.statusText
        this.response.headers = err.response?.headers
        this.response.data = err.response?.data
        this.response.ok = false
      }
      const error = err instanceof HttpError
        ? err
        : new HttpError(this.response?.status || 0, err?.message, {
          method: this.method,
          url: this.fullURLQuery,
          headers: this.headers,
          ...err.more,
          ...this.response
        })
      throw error
    } finally {
      this.proxy.vars && this.applyVar()
    }
    return this.response?.data
  }

  async send(moreOptions = {}) {
    const rs = await fetch(this.fullURLQuery, {
      ...this.fetchOpts,
      ...moreOptions
    })
    this.response = {
      ok: rs.ok,
      headers: this.getResponseHeader(rs),
      status: rs.status,
      statusText: rs.statusText
    }
    return this.response
  }

  async dispose() {
    this.abort()
  }

  protected applyVar() {
    if (!this.proxy.vars) return
    let varNames: string
    if (typeof this.proxy.vars === 'string') {
      varNames = this.proxy.vars
    } else {
      varNames = Object.keys(this.proxy.vars).map(v => `${v}`).join(', ')
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
    this.headers[key] = value
  }

  protected getResponseHeader(rs: Response) {
    const headers: Record<string, string> = {}
    rs.headers.forEach((vl, key) => {
      headers[key] = vl
    })
    return headers
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
