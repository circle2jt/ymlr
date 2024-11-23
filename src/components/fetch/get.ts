import chalk from 'chalk'
import { createWriteStream, type WriteStream } from 'fs'
import { File } from 'src/libs/file'
import { formatNumber } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { type GetProps } from './get.props'
import { Head } from './head'
import { type ResponseType } from './types'

/** |**  fetch'get
  Send a http request with GET method
  @example
  Get data from API then store value in `vars.posts`
  ```yaml
    # GET http://localhost:3000/posts?category=users
    - name: Get list posts
      fetch'get:
        url: /posts
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
        baseURL: http://localhost:3000  # !optional - Request base url
        query:                          # !optional - Request query string
          category: users
        headers:                        # !optional - Request headers
          authorization: Bearer TOKEN
        responseType: json              # !optional - Default is json ['json' | 'blob' | 'text' | 'buffer' | 'none']
      vars: posts                       # !optional - Global variable which store value after executed
  ```

  Download file from a API
  ```yaml
    # GET http://localhost:3000/posts?category=users
    - name: Download a file
      fetch'get:
        baseURL: http://localhost:3000
        url: /posts
        query:
          category: users
        headers:
          authorization: Bearer TOKEN
        saveTo: /tmp/post.json
  ```
*/
export class Get extends Head {
  method = 'get'
  responseType?: ResponseType
  saveTo?: string

  private isDownload?: boolean
  private onDownloadProgress?: (data: any) => any

  constructor({ responseType, saveTo, ...props }: GetProps) {
    super(props)
    Object.assign(this, { responseType, saveTo })
  }

  override async send(moreOptions: any = {}) {
    if ((!this.responseType && this.saveTo)) this.responseType = 'stream'
    if (this.responseType === 'stream') this.isDownload = true
    if (this.isDownload) {
      // eslint-disable-next-line no-case-declarations
      if (this.logger.is(LoggerLevel.trace)) {
        this.logger.trace(chalk.gray.dim('Connecting ...'))
        this.onDownloadProgress = moreOptions.onDownloadProgress = (data: any) => {
          const { bytes, loaded } = data
          this.logger.trace(chalk.gray(`Downloading ${formatNumber(loaded / 1024, { maximumFractionDigits: 0 })} kbs | Rate: ${formatNumber(bytes, { maximumFractionDigits: 0 })} bytes`))
        }
      }
    }
    const rs = await fetch(this.fullURLQuery, {
      ...this.fetchOpts,
      ...moreOptions
    })
    this.response = {
      status: rs.status,
      statusText: rs.statusText,
      headers: this.getResponseHeader(rs),
      data: await this.getResponseData(rs)
    }
    return this.response
  }

  protected async getResponseData(rs: Response) {
    if (this.responseType === 'none') {
      return undefined
    }
    if (!this.saveTo) {
      switch (this.responseType) {
        case 'blob':
          return await rs.blob()
        case 'arraybuffer':
          return Buffer.from(await rs.arrayBuffer())
        case 'json':
          return await rs.json()
        default:
          return await rs.text()
      }
    }
    if (!rs.body) return undefined
    const stream = createWriteStream(this.saveTo, { autoClose: true, emitClose: false }) as WriteStream & { asyncWrite: (chunk: any) => Promise<void> }
    stream
      .once('error', () => { })
      .asyncWrite = async function (chunk: any) {
        await new Promise((resolve, reject) => {
          this.write(chunk, (err) => {
            if (err) reject(err)
            else resolve(undefined)
          })
        })
      }
    let loaded = 0
    const wstream = new WritableStream({
      write: async (chunk: any) => {
        const bytes = chunk.length
        loaded += bytes
        await stream.asyncWrite(chunk)
        this.onDownloadProgress?.({
          bytes,
          loaded
        })
      }
    })
    await rs.body.pipeTo(wstream, { signal: this.abortController.signal })
    this.onDownloadProgress?.({
      bytes: 0,
      loaded
    })
    return new File(this.saveTo, this.proxy.scene)
  }
}
