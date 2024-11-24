import axios, { type AxiosResponse } from 'axios'
import chalk from 'chalk'
import { createWriteStream } from 'fs'
import { type IncomingMessage } from 'http'
import { File } from 'src/libs/file'
import { formatNumber } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { finished } from 'stream/promises'
import { type GetProps } from './get.props'
import { Head } from './head'
import { type ResponseType } from './types'

/** |**  http'get
  Send a http request with GET method
  @example
  Get data from API then store value in `vars.posts`
  ```yaml
    # GET http://localhost:3000/posts?category=users
    - name: Get list posts
      http'get:
        url: /posts
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
        baseURL: http://localhost:3000  # !optional - Request base url
        query:                          # !optional - Request query string
          category: users
        headers:                        # !optional - Request headers
          authorization: Bearer TOKEN
        responseType: json              # !optional - Default is json ['json' | 'blob' | 'text' | 'buffer' | 'none']
        validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
      vars: posts                       # !optional - Global variable which store value after executed
  ```

  Download file from a API
  ```yaml
    # GET http://localhost:3000/posts?category=users
    - name: Download a file
      http'get:
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

  constructor({ responseType, saveTo, ...props }: GetProps) {
    super(props)
    Object.assign(this, { responseType, saveTo })
  }

  override async send(moreOptions: any = {}) {
    if ((!this.responseType && this.saveTo)) this.responseType = 'stream'
    if (this.responseType === 'stream') this.isDownload = true
    if (this.isDownload) {
      if (!this.responseType) this.responseType = 'stream'
      // eslint-disable-next-line no-case-declarations
      if (this.logger.is(LoggerLevel.trace)) {
        this.logger.trace(chalk.gray.dim('Connecting ...'))
        moreOptions.onDownloadProgress = (data: any) => {
          const { bytes, loaded } = data
          this.logger.trace(chalk.gray(`Downloading ${formatNumber(loaded / 1024, { maximumFractionDigits: 0 })} kbs | Rate: ${formatNumber(bytes, { maximumFractionDigits: 0 })} bytes`))
        }
      }
    }
    const rs = await axios({
      responseType: this.responseType === 'none' ? 'stream' : this.responseType,
      ...this.axiosOpts,
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

  // protected async handleCustomResponse() {
  //   if (this.response?.data === undefined || this.response?.data === null) return this.response?.data
  //   const rs: any = {
  //     body: this.response.data,
  //     json() {
  //       if (typeof this.body === 'object') return this.body
  //       return JSON.parse(this.body)
  //     },
  //     blob() {
  //       let txt = ''
  //       if (typeof this.body === 'object') txt = JSON.stringify(this.body)
  //       txt = this.body.toString()
  //       return new Blob([txt])
  //     },
  //     arrayBuffer() {
  //       return this.blob().arrayBuffer()
  //     }
  //   }
  //   if (this.responseType === 'pipe') {
  //     if (this.response.data?.path) {
  //       const path = this.scene.getPath(this.response.data.path)
  //       rs.body = new ReadableStream({
  //         start(controller) {
  //           return new Promise((resolve, reject) => {
  //             const reader = createReadStream(path)
  //             reader.on('data', (chunk: any) => {
  //               controller.enqueue(chunk);
  //             })
  //             reader.on('error', reject)
  //             reader.on('end', () => {
  //               controller.close()
  //               resolve(undefined)
  //             })
  //           })
  //         },
  //       });
  //     }
  //   }
  //   this.response.data = await this.getResponseData(rs)
  // }

  protected async getResponseData(rs: AxiosResponse) {
    if (this.responseType === 'none') {
      const data: IncomingMessage = rs.data
      data.destroy()
      return undefined
    }
    if (!this.saveTo) return rs.data
    // eslint-disable-next-line no-case-declarations
    const stream = createWriteStream(this.saveTo, { autoClose: false, emitClose: false })
    const body: IncomingMessage = rs.data
    await finished(body.pipe(stream))
    return new File(this.saveTo, this.proxy.scene)
  }
}
