import assert from 'assert'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'
import { parse } from 'querystring'
import { bindFunctionScript } from 'src/libs/async-function'
import { promisify } from 'util'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import type Group from '../group'
import { type GroupItemProps, type GroupProps } from '../group/group.props'
import { BasicAuth } from './auth/BasicAuth'
import { CustomAuth } from './auth/CustomAuth'
import { type IVerify } from './auth/IVerify'

/** |**  http'server
  Create a http server to serve content via http
  @example
  ```yaml
    - http'server:
        address: 0.0.0.0:8811                   # Address to listen
        auth:                                   # Check authentication
          basic:                                # 'Basic ' + base64(`${username}:${password}`)
            username: username
            password: password
          custom:
            secret: 'SERVER_SECRET_TOKEN'
            secretKey: SECRET_HEADER_KEY
            verify(): |
              return $parentState.headers[this.secretKey] === this.secret
      runs:                                   # Execute when a request comes
        - echo: ${ $parentState.path }        # Get request path
        - echo: ${ $parentState.method }      # Get request method
        - echo: ${ $parentState.headers }     # Get request headers
        - echo: ${ $parentState.query }       # Get request query string
        - echo: ${ $parentState.body }        # Get request body
        - echo: ${ $parentState.response }    # Set response data
                                              # - status: 200       - http response status
                                              # - statusMessage: OK - http response status message
                                              # - headers: {}       - Set response headers
                                              # - data: {}          - Set response data
        - echo: ${ $parentState.req }         # Ref to req in http.IncomingMessage in nodejs
        - echo: ${ $parentState.res }         # Ref to res in http.ServerResponse in nodejs
        - js: |                               # Handle response by yourself (When $parentState.response is undefined)
            $parentState.res.status = 200
            $parentState.res.statusMessage = 'OK'
            $parentState.res.write('OK')
            $parentState.res.end()
  ```
*/
export class HttpServer implements Element {
  readonly proxy!: ElementProxy<this>

  address: string = '0.0.0.0:8811'
  auth?: {
    basic?: {
      username: string
      password: string
    }
    custom?: {
      [prop: string]: any
      verify: string
    }
  }

  #authVerifier?: IVerify
  #server?: Server

  private get logger() { return this.proxy.logger }

  // Support runs
  innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  constructor({ address, auth, type, ...props }: any) {
    Object.assign(this, { address, auth, type, ...props })
  }

  async exec() {
    assert(this.address)
    if (this.auth?.basic) {
      this.#authVerifier = new BasicAuth(this.auth.basic.username, this.auth.basic.password)
    } else if (this.auth?.custom) {
      const { 'verify()': verify, ...props } = this.auth.custom
      this.#authVerifier = new CustomAuth(props)
      this.#authVerifier.verify = bindFunctionScript(verify, this.#authVerifier, '$parentState')
    }
    await new Promise((resolve, reject) => {
      const [host, port] = this.address.trim().split(':')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.#server = createServer(async (req, res) => {
        await this.handleRequest(req, res)
      }).on('error', reject)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('close', async () => {
          await this.stop()
          resolve(undefined)
        })
        .listen(+port, host, () => {
          this.logger.debug('http\'#server is listened at %s', this.address)
        })
    })
    return []
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const [path, qstr] = req.url?.split('?') || []
    const parentState = {
      path,
      method: req.method as string,
      headers: req.headers,
      query: parse(qstr),
      body: undefined,
      response: undefined,
      get data() {
        return {
          ...parentState.headers,
          ...parentState.query,
          ...parentState.body
        }
      },
      req,
      res
    } as any
    this.logger
      .debug('%s %s \t%s', '⥃', req.method, req.url)
      .trace('%j', parentState)
    try {
      if (this.#authVerifier) {
        const code = await this.#authVerifier.verify(parentState)
        if (code === false) {
          res.statusCode = 401
          return
        }
        if (typeof code === 'number') {
          res.statusCode = code
          return
        }
      }
      const body = await this.getRequestBody(req)
      if (body) {
        const requestType = parentState.headers['content-type']
        if (requestType?.includes('/json')) {
          parentState.body = JSON.parse(body)
        } else if (requestType?.includes('/xml')) {
          const { parseString } = require('xml2js')
          parentState.body = await promisify(parseString)(body)
        } else {
          parentState.body = body
        }
      }
      res.statusCode = 204
      await this.innerRunsProxy.exec(parentState)
      if (!this.#server) {
        res.statusCode = 503
        res.end()
        return
      }
      const response = parentState.response
      if (response) {
        if (response.status) {
          res.statusCode = response.status
        }
        if (response.statusMessage) {
          res.statusMessage = response.statusMessage
        }
        if (response.headers) {
          for (const k in response.headers) {
            res.setHeader(k, response.headers[k]?.toString() || '')
          }
        }
        const resData = response.data
        if (resData !== undefined && resData !== null) {
          if (!response.status) {
            res.statusCode = 200
          }
          if (resData instanceof Buffer) {
            res.write(resData)
            return
          }
          if (typeof resData === 'object') {
            res.write(JSON.stringify(resData))
            return
          }
          res.write(resData.toString())
        }
      }
    } catch (err: any) {
      this.logger.error(err)
    } finally {
      res.end()
    }
  }

  private async getRequestBody(req: IncomingMessage) {
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('error', reject)
      req.on('end', () => {
        resolve(Buffer.concat(chunks).toString())
      })
    })
  }

  async stop() {
    if (!this.#server?.listening) return
    this.#server?.close()
    this.#server = undefined
  }

  async dispose() {
    await this.stop()
  }
}
