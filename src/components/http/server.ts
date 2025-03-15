import assert from 'assert'
import { type CorsOptions } from 'cors'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'
import { parse } from 'querystring'
import { bindFunctionScript } from 'src/libs/async-function'
import { Constants } from 'src/managers/constants'
import { promisify } from 'util'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Group } from '../group/group'
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
            onCheck: |
              return $ps.headers[this.secretKey] === this.secret
        // cors: {}                           # enable all cors requests
        cors:                                 # Ref: https://www.npmjs.com/package/cors#configuring-cors
          origin: '*'
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
          allowedHeaders: ['Content-Type', 'Authorization']
          exposedHeaders: ['Content-Range', 'X-Content-Range']
          credentials?: boolean | undefined;
          maxAge?: number | undefined;
          preflightContinue: false
          optionsSuccessStatus: 204
        opts:
          timeout: 0                          # The number of milliseconds of inactivity before a socket is presumed to have timed out.
          keepAliveTimeout: 0                 # The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed
          headersTimeout: 0                   # Limit the amount of time the parser will wait to receive the complete HTTP headers.
          maxConnections: 0                   # Set this property to reject connections when the server's connection count gets high.
          maxHeadersCount: 0                  # Limits maximum incoming headers count. If set to 0, no limit will be applied.
          maxRequestsPerSocket: 0             # The maximum number of requests socket can handle before closing keep alive connection.
          requestTimeout: 0                   # Sets the timeout value in milliseconds for receiving the entire request from the client.
      runs:                                   # Execute when a request comes
        - echo: ${ $ps.httpRequest.path }     # Get request path
        - echo: ${ $ps.httpRequest.method }   # Get request method
        - echo: ${ $ps.httpRequest.headers }  # Get request headers
        - echo: ${ $ps.httpRequest.query }    # Get request query string
        - echo: ${ $ps.httpRequest.body }     # Get request body
        - echo: ${ $ps.httpRequest.response } # Set response data
                                              # - status: 200       - http response status
                                              # - statusMessage: OK - http response status message
                                              # - headers: {}       - Set response headers
                                              # - data: {}          - Set response data
        - echo: ${ $ps.httpRequest.req }      # Ref to req in http.IncomingMessage in nodejs
        - echo: ${ $ps.httpRequest.res }      # Ref to res in http.ServerResponse in nodejs
        - js: |                               # Handle response by yourself (When $ps.response is undefined)
            $ps.httpRequest.res.status = 200
            $ps.httpRequest.res.statusMessage = 'OK'
            $ps.httpRequest.res.write('OK')
            $ps.httpRequest.res.end()
  ```
*/
export class HttpServer implements Element {
  readonly proxy!: ElementProxy<this>

  address: string = '0.0.0.0:8811'
  opts?: {
    timeout?: number
    keepAliveTimeout?: number
    headersTimeout?: number
    maxConnections?: number
    maxHeadersCount?: number
    maxRequestsPerSocket?: number
    requestTimeout?: number
  }

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

  cors?: CorsOptions

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
      const { onCheck, ...props } = this.auth.custom
      this.#authVerifier = new CustomAuth(props)
      this.#authVerifier.verify = bindFunctionScript<IVerify['verify']>(onCheck, this.#authVerifier,
        '$parentState',
        '$ps',
        '$vars',
        '$v',
        '$utils',
        '$u',
        '$const',
        '$c',
        '$env',
        '$e'
      )
    }
    await new Promise((resolve, reject) => {
      const [host, port] = this.address.trim().split(':')
      let handler: any
      if (this.cors) {
        const corsHandler = require('cors')
        handler = async (req: IncomingMessage, res: ServerResponse) => {
          corsHandler(this.cors)(req, res, async () => {
            await this.handleRequest(req, res)
          })
        }
      } else {
        handler = this.handleRequest.bind(this)
      }
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.#server = createServer(handler)
        .on('error', reject)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('close', async () => {
          await this.stop()
          resolve(undefined)
        })
        .listen(+port, host, () => {
          this.logger.debug('http\'#server is listened at %s', this.address)
        })
      if (this.opts) {
        for (const [key, value] of Object.entries(this.opts)) {
          (this.#server as any)[key] = value
        }
      }
    })
    return []
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const [path, qstr] = req.url?.split('?') || []
    const parentState = {
      httpRequest: {
        path,
        method: req.method as string,
        headers: req.headers,
        query: parse(qstr),
        body: undefined,
        response: undefined,
        // data: {
        //   ...parentState?.headers,
        //   ...parentState?.query,
        //   ...parentState?.body
        // },
        req,
        res
      }
    } as any
    this.logger.debug('%s %s \t%s', '⥃', req.method, req.url)?.trace('%j', parentState.httpRequest)
    try {
      if (this.#authVerifier) {
        const code = await this.#authVerifier.verify(
          parentState,
          parentState,
          this.proxy.scene.localVars,
          this.proxy.scene.localVars,
          this.proxy.rootScene.globalUtils,
          this.proxy.rootScene.globalUtils,
          Constants,
          Constants,
          process.env,
          process.env
        )
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
        const requestType = parentState.httpRequest.headers['content-type']
        if (requestType?.includes('/json')) {
          parentState.httpRequest.body = JSON.parse(body)
        } else if (requestType?.includes('/xml')) {
          const { parseString } = require('xml2js')
          parentState.httpRequest.body = await promisify(parseString)(body)
        } else {
          parentState.httpRequest.body = body
        }
      }
      res.statusCode = 204
      await this.innerRunsProxy.exec(parentState)
      if (!this.#server) {
        res.statusCode = 503
        res.end()
        return
      }
      const response = parentState.httpRequest.response
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
          res.write(`${resData}`)
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
      const chunks = new Array<Uint8Array>()
      req.on('data', (chunk: Uint8Array) => chunks.push(chunk))
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
