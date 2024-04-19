import chalk from 'chalk'
import { readFile } from 'fs/promises'
import { formatNumber } from 'src/libs/format'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { Get } from './get'
import { type PostProps } from './post.props'
import { type RequestType, type UploadFile } from './types'

/** |**  fetch'post
  Send a http request with POST method
  @example
  Post data to API then store value in `vars.posts`
  ```yaml
    # POST http://localhost:3000/posts?category=users
    - name: Create a new post
      fetch'post:
        baseURL: http://localhost:3000
        url: /posts
        query:
          category: users
        headers:
          authorization: Bearer TOKEN
        type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
        body: {
          "title": "My title",
          "description": "My description"
        }
        responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      vars: newPost
  ```
  Upload file to server
  ```yaml
    # POST http://localhost:3000/upload
    - name: Upload a new avatar
      fetch'post:
        baseURL: http://localhost:3000
        url: /upload
        headers:
          authorization: Bearer TOKEN
        type: multipart
        body: {
          "category": "avatar",
          "file": { # File upload must includes path of file, name is optional
            "path": "/tmp/my_avatar.jpg",
            "name": "thanh_avatar"
          }
        }
      vars:
        status: ${this.response.status}
  ```
*/
export class Post extends Get {
  method = 'post'
  type?: RequestType
  body?: any

  #isUpload?: boolean

  constructor({ type, body, ...props }: PostProps) {
    super(props)
    Object.assign(this, { type, body })
  }

  override async send(moreOptions: any = {}) {
    const body = await this.getRequestBody()
    if (this.#isUpload) {
      // eslint-disable-next-line no-case-declarations
      if (this.logger.is(LoggerLevel.trace)) {
        this.logger.trace(chalk.gray.dim('Connecting ...'))
        moreOptions.onUploadProgress = (data: any) => {
          const { bytes, loaded } = data
          this.logger.trace(chalk.gray(`Uploading ${formatNumber(loaded / 1024, { maximumFractionDigits: 0 })} kbs | Rate: ${formatNumber(bytes, { maximumFractionDigits: 0 })} bytes`))
        }
      }
    }
    try {
      const rs = await super.send({
        body,
        ...moreOptions
      })
      return rs
    } catch (err: any) {
      err.more = {
        body
      }
      throw err
    }
  }

  protected async getRequestBody() {
    if (!this.type) this.type = 'json'
    let body = this.body
    const hasBody = this.body !== null && this.body !== undefined
    this.logger.debug('%s\t%j', chalk.gray('‣ Body   '), body)
    if (this.type === 'json') {
      this.setHeader('content-type', 'application/json')
      body = JSON.stringify(body)
    } else if (this.type === 'form') {
      this.setHeader('content-type', 'application/x-www-form-urlencoded')
      if (hasBody) {
        body = new URLSearchParams(body)
      }
    } else if (this.type === 'multipart') {
      if (hasBody) {
        const form1 = new FormData()
        const keys = Object.keys(body)
        for (const key of keys) {
          const vl = this.body[key]
          // file: {path: '', name: '', }
          if (typeof vl === 'object') {
            if (!this.#isUpload) this.#isUpload = true
            const { path, name } = vl as UploadFile
            const buf = await readFile(this.proxy.scene.getPath(path))
            form1.append(key, new Blob([buf]), name)
          } else {
            form1.append(key, vl)
          }
        }
        body = form1
      }
    } else if (this.type === 'text') {
      this.setHeader('content-type', 'text/plain')
      if (hasBody) {
        body = body.toString()
      }
    }
    return body
  }
}
