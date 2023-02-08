import assert from 'assert'
import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import merge from 'lodash.merge'
import { parse } from 'querystring'
import { Job } from 'src/components/.job/job'
import { BasicAuth } from './auth/BasicAuth'
import { IVerify } from './auth/IVerify'
import { SubJobData } from './sub-job-data.props'
import { SubProps } from './sub.props'

/** |**  http/jobs
  Create a jobs queue to do something step by step
  @example
  ```yaml
    - http/jobs:
        address: 0.0.0.0:8811           # Address to listen to add a new job to
        queue:                          # Wait to finish a job before keep doing the next
          file: /tmp/test.queue         # Path of file which stores jobs data to reload when restart queue
          concurrent: 1                 # Num of jobs can be run parallel
          password: ***                 # Password to encrypt queue file
        runs:                           # Steps to do a job
          - ${parentState.jobData}      # {parentState.jobData} is job data in the queue which is included both querystring and request body
          - ${parentState.jobInfo}      # {parentState.jobInfo} is job information
                                        # {parentState.jobInfo.path} request path
                                        # {parentState.jobInfo.method} request method
                                        # {parentState.jobInfo.query} request query string
                                        # {parentState.jobInfo.headers} request headers
                                        # {parentState.jobRes} Respnose data directly when client send a "PUT" request
  ```

  Use a file store to save queue data
  @example
  ```yaml
    - file'store:                       # Defined a file store to save data to file
        path: /tmp/test.queue,
        initData: [],
        vars:
          fileStorage: '${this}'

    - http/jobs:
        address: 0.0.0.0:8811           # Address to listen to add a new job to
        queue:                          # Wait to finish a job before keep doing the next. If not set, it's will run ASAP when received requests
          concurrent: 1                 # Num of jobs can be run parallel
          storage: ${vars.fileStorage}  # Set a storage to queue
        runs:                           # Steps to do a job
          - ${parentState.jobData}      # {parentState.jobData} is job data in the queue which is included both querystring and request body
          - ${parentState.jobInfo}      # {parentState.jobInfo} is job information
                                        # {parentState.jobInfo.path} request path
                                        # {parentState.jobInfo.method} request method
                                        # {parentState.jobInfo.query} request query string
                                        # {parentState.jobInfo.headers} request headers
  ```
*/
export class Sub extends Job {
  address: string = '0.0.0.0:8811'
  secure?: {
    basic?: {
      username: string
      password: string
    }
  }

  auth?: IVerify

  private server?: Server

  constructor({ address, secure, ...props }: SubProps) {
    super(props)
    Object.assign(this, { address, secure })
    this.$$ignoreEvalProps.push('server', 'auth')
  }

  async execJob() {
    assert(this.address)
    if (this.secure?.basic) {
      this.auth = new BasicAuth(this.secure.basic.username, this.secure.basic.password)
    }
    await new Promise((resolve, reject) => {
      const [host, port] = this.address.trim().split(':')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.server = createServer(async (req, res) => await this.handleRequest(req, res))
        .on('error', reject)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('close', async () => {
          await super.stop()
          resolve(undefined)
        })
        .listen(+port, host, () => {
          this.logger.debug('http/jobs listened at %s', this.address)
        })
    })
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    this.logger.debug('%s %s \t%s', '⥃', req.method, req.url)
    const [path, qstr] = req.url?.split('?') || []
    const jobData: SubJobData = {
      jobInfo: {
        path,
        method: req.method as string,
        headers: req.headers,
        query: parse(qstr)
      },
      jobData: {},
      jobRes: undefined
    }
    jobData.jobData = jobData.jobInfo.query
    const logs = [this.auth ? 'secured' : 'unsecured']
    try {
      const requestBodyText = await this.getRequestBody(req)
      const requestBody = requestBodyText ? JSON.parse(requestBodyText) : requestBodyText
      merge(jobData.jobData, requestBody)

      const isAuth = await this.auth?.verify(jobData)
      if (isAuth === false) {
        res.statusMessage = logs.join('-')
        res.statusCode = 401
        res.end()
        return
      }

      if (jobData.jobInfo.query.jobRes) {
        logs.push('pipe')
        jobData.jobRes = res
        await this.runEachOfElements(jobData)
      } else {
        if (!this.jobsManager) {
          jobData.jobRes = res
          logs.push('pipe')
        } else {
          logs.push('queue')
        }
        await this.addJobData(jobData)
      }
    } finally {
      res.statusCode = 200
      res.statusMessage = logs.join('-')
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
    if (!this.server?.listening) return
    this.server?.close()
  }

  async dispose() {
    await this.stop()
    await super.dispose()
  }
}
