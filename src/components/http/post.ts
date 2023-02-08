import chalk from 'chalk'
import { readFileSync } from 'fs'
import { Get } from './get'
import { PostProps } from './post.props'
import { RequestType, UploadFile } from './types'
/** |**  http'post
  Send a http request with POST method
  @example
  Post data to API then store value in `vars.posts`
  ```yaml
    # POST http://localhost:3000/posts?category=users
    - http'post:
        title: Create a new post
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
    - http'post:
        title: Upload a new avatar
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

  constructor({ type, body, ...props }: PostProps) {
    super(props)
    Object.assign(this, { type, body })
  }

  async send(fetchOpts: any = {}) {
    if (!this.type) this.type = 'json'
    const body = this.getRequestBody()
    const rs = await fetch(this.fullURLQuery, {
      method: this.method,
      headers: this.headers,
      body,
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

  protected getRequestBody() {
    if (this.body === null || this.body === undefined) return this.body
    this.logger.debug('%s\t%j', chalk.gray('‣ Body   '), this.body)
    if (this.type === 'json') {
      this.setHeader('content-type', 'application/json')
      return JSON.stringify(this.body)
    }
    if (this.type === 'form') {
      this.setHeader('content-type', 'application/x-www-form-urlencoded')
      const form2 = new URLSearchParams()
      Object.keys(this.body).forEach(key => form2.append(key, this.body[key]))
      return form2
    }
    if (this.type === 'multipart') {
      // this.setHeader('content-type', 'multipart/form-data')
      const form1 = new FormData()
      Object.keys(this.body).forEach(key => {
        const vl = this.body[key]
        // file: {path: '', name: '', }
        if (typeof vl === 'object') {
          const { path, name } = vl as UploadFile
          form1.append(key, new Blob([readFileSync(this.scene.getPath(path))]), name)
        } else {
          form1.append(key, vl)
        }
      })
      return form1
    }
    if (this.type === 'text') {
      this.setHeader('content-type', 'text/plain')
      return this.body.toString()
    }
    return this.body
  }
}
