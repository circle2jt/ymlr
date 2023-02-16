import chalk from 'chalk'
import { createWriteStream } from 'fs'
import { File } from 'src/libs/file'
import { formatNumber } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger'
import { ProgressBar } from 'src/libs/progress-bar'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import { GetProps } from './get.props'
import { Head } from './head'
import { ResponseType } from './types'

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

  constructor({ responseType, saveTo, ...props }: GetProps) {
    super(props)
    Object.assign(this, { responseType, saveTo })
  }

  async exec() {
    if (this.saveTo) {
      this.responseType = 'pipe'
      this.saveTo = this.scene.getPath(this.saveTo)
    }
    if (!this.responseType) this.responseType = 'json'
    return await super.exec()
  }

  async send(fetchOpts: any = {}) {
    const rs = await fetch(this.fullURLQuery, {
      method: this.method,
      headers: this.headers,
      ...fetchOpts
    })
    const data = await this.getResponseData(rs)
    this.response = {
      ok: rs.ok,
      headers: this.getResponseHeader(rs),
      data,
      status: rs.status,
      statusText: rs.statusText
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

  protected async getResponseData(rs: Response) {
    switch (this.responseType) {
      case 'none':
        return undefined
      case 'json':
        return await rs.json()
      case 'blob':
        return await rs.blob()
      case 'buffer':
        return await rs.arrayBuffer()
      case 'pipe':
        if (!this.saveTo) return undefined
        // eslint-disable-next-line no-case-declarations
        const bar = this.logger.is(LoggerLevel.INFO) ? new ProgressBar(this.logger.clone()) : undefined
        if (this.$$baseProps.name) bar?.logger.addIndent()
        await bar?.start(chalk.gray.dim('Connecting to server...'))
        try {
          const stream = createWriteStream(this.saveTo, { autoClose: false, emitClose: false })
          const body = Readable.fromWeb(rs.body as any)
          if (bar) {
            let total = 0
            body.on('data', (chunk: Buffer) => {
              const len = chunk.byteLength
              total += len
              bar?.update(chalk.gray(`Downloading ${formatNumber(total / 1000, { maximumFractionDigits: 0 })} kbs | Rate: ${formatNumber(len, { maximumFractionDigits: 0 })} bytes`))
            })
          }
          await finished(body.pipe(stream))
        } finally {
          if (this.$$baseProps.name) bar?.logger.addIndent(-1)
          await bar?.stop()
        }
        return new File(this.saveTo, this.scene)
      default:
        return await rs.text()
    }
  }
}
