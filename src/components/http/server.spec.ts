import axios from 'axios'
import { type ElementProxy } from 'src/components/element-proxy'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { HttpServer } from './server'

let serve: ElementProxy<HttpServer>
const tmp = new FileTemp()

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await serve.dispose()
  tmp.remove()
})

test('Listen to handle a request', async () => {
  const jobData = { foo: 'bar' }
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3001',
    runs: [
      {
        vars: {
          method: '${$parentState.method}',
          body: '${$parentState.body}'
        }
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await axios.post('http://0.0.0.0:3001', jobData)
    await serve.dispose()
  }, 1000)
  await serve.exec()
  expect(Testing.vars.method).toEqual('POST')
  expect(Testing.vars.body).toEqual(jobData)
})

test('Force quit server', async () => {
  const jobData = { foo: 'bar' }
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3002',
    runs: [
      {
        vars: {
          method: '${$parentState.method}',
          body: '${$parentState.body}'
        }
      },
      {
        stop: null
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    try {
      await axios.post('http://0.0.0.0:3002', jobData)
    } catch (err: any) {
      expect(err.response.status).toBe(503)
    }
  }, 1000)
  await serve.exec()
  expect(Testing.vars.method).toEqual('POST')
  expect(Testing.vars.body).toEqual(jobData)
})

test('Check custom authentication', async () => {
  const jobData = { foo: 'bar' }
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3003',
    auth: {
      custom: {
        secret: 'SERVER_SECRET_TOKEN',
        secretKey: 'SECRET_HEADER_KEY',
        'verify()': `
          return $parentState.headers[this.secretKey.toLowerCase()] === this.secret
        `
      }
    },
    runs: [
      {
        vars: {
          method: '${$parentState.method}',
          body: '${$parentState.body}'
        }
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    try {
      await axios.post('http://0.0.0.0:3003', jobData)
    } catch (err: any) {
      expect(err.response.status).toBe(401)
    }
    const resp = await axios.post('http://0.0.0.0:3003', jobData, {
      headers: {
        SECRET_HEADER_KEY: 'SERVER_SECRET_TOKEN'
      }
    })
    expect(resp.status).toBe(204)

    await serve.dispose()
  }, 1000)
  await serve.exec()
  expect(Testing.vars.body).toEqual(jobData)
})

test('Check basic authentication via headers', async () => {
  const jobData = { foo: 'bar' }
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3003',
    auth: {
      basic: {
        username: 'thanh',
        password: '123'
      }
    },
    runs: [
      {
        vars: {
          method: '${$parentState.method}',
          body: '${$parentState.body}'
        }
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    try {
      await axios.post('http://0.0.0.0:3003', jobData)
    } catch (err: any) {
      expect(err.response.status).toBe(401)
    }
    const resp = await axios.post('http://0.0.0.0:3003', jobData, {
      headers: {
        authorization: `Basic ${Testing.rootScene.globalUtils.base64.encode('thanh:123')}`
      }
    })
    expect(resp.status).toBe(204)

    await serve.dispose()
  }, 1000)
  await serve.exec()
  expect(Testing.vars.body).toEqual(jobData)
})

test('Test response by code', async () => {
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3004',
    runs: [
      {
        "exec'js": `
          await new Promise(r => setTimeout(r, 500))
          $parentState.res.writeHead(200, {
            key1: 'value 1'
          })
          $parentState.res.write('ok')
        `
      },
      {
        stop: null
      }
    ]
  })
  let resp: any
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    resp = await axios.post('http://0.0.0.0:3004')
  }, 1000)
  await serve.exec()
  expect(resp.status).toBe(200)
  expect(resp.data).toBe('ok')
  expect(resp.headers.key1).toBe('value 1')
})

test('Test response by return data', async () => {
  serve = await Testing.createElementProxy(HttpServer, {
    address: '0.0.0.0:3005',
    runs: [
      {
        "exec'js": `
          await new Promise(r => setTimeout(r, 500))
          $parentState.response = {
            status: 200,
            headers: {
              key1: 'value 1'
            },
            data: {
              ok: true
            }
          }
        `
      }
    ]
  })
  let resp: any
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    resp = await axios.post('http://0.0.0.0:3005')
    await serve.dispose()
  }, 3000)
  await serve.exec()
  expect(resp.status).toBe(200)
  expect(resp.headers.key1).toBe('value 1')
  expect(resp.data?.ok).toBe(true)
})
