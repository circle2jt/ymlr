import axios from 'axios'
import { escape } from 'querystring'
import { ElementProxy } from 'src/components/element-proxy'
import { FileStore } from 'src/components/file/file-store'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { Sub } from './sub'

let sub: ElementProxy<Sub>
const tmp = new FileTemp()

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await sub.dispose()
  tmp.remove()
})

test('Listen to handle jobs in queue', async () => {
  const jobData = { foo: 'bar' }
  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4001',
    queue: {
      file: tmp.file
    },
    runs: [
      {
        vars: {
          jobData: '${$parentState.jobData}'
        }
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await axios.post('http://0.0.0.0:4001', jobData)
  }, 1000)
  await sub.exec()
  expect(Testing.vars.jobData).toEqual(jobData)
})

test('Check basic authentication via headers', async () => {
  const jobData = { foo: 'bar' }
  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4001',
    secure: {
      basic: {
        username: 'thanh',
        password: '123'
      }
    },
    runs: [
      {
        vars: {
          jobData: '${$parentState.jobData}'
        }
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    const resp = await axios.post('http://0.0.0.0:4001', jobData, {
      headers: {
        authorization: `Basic ${Testing.rootScene.globalUtils.base64.encrypt('thanh:123')}`
      }
    })
    expect(resp.status).toBe(200)
    expect(resp.statusText).toBe('secured-pipe')
  }, 1000)
  await sub.exec()
  expect(Testing.vars.jobData).toEqual(jobData)
})

test('Check basic authentication via querystring', async () => {
  const jobData = { foo: 'bar' }
  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4001',
    secure: {
      basic: {
        username: 'thanh',
        password: '123'
      }
    },
    queue: {
      concurrent: 1
    },
    runs: [
      {
        if: '${$parentState.jobData}',
        vars: {
          jobData: '${$parentState.jobData}'
        }
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    const token = escape(`Basic ${Testing.rootScene.globalUtils.base64.encrypt('thanh:123')}`)
    const resp = await axios.post(`http://0.0.0.0:4001?authorization=${token}`, jobData)
    expect(resp.status).toBe(200)
    expect(resp.statusText).toBe('secured-queue')
  }, 1000)
  await sub.exec()
  expect(Testing.vars.jobData.foo).toEqual('bar')
})

test('Test storage is ref ID', async () => {
  const jobData = { foo: 'bar' }
  const fs = await Testing.createElementProxy(FileStore, {
    path: tmp.file,
    initData: [],
    vars: {
      fileStorage: '${this}'
    }
  })
  await fs.exec()
  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4002',
    queue: {
      storage: '${$vars.fileStorage}'
    },
    runs: [
      {
        vars: {
          jobData: '${$parentState.jobData}',
          jobInfo: '${$parentState.jobInfo}'
        }
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  const t = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      try {
        await axios.post('http://0.0.0.0:4002/test?foo=bar', jobData, {
          headers: {
            author: 'thanh'
          }
        })
      } catch (err) {
        reject(err)
      }
      resolve(undefined)
    }, 5000)
  })
  await sub.exec()
  await t
  expect(Testing.vars.jobData).toEqual(jobData)
  expect(Testing.vars.jobInfo.path).toBe('/test')
  expect(Testing.vars.jobInfo.query).toEqual({ foo: 'bar' })
  expect(Testing.vars.jobInfo.method).toBe('POST')
  expect(Testing.vars.jobInfo.headers.author).toBe('thanh')
  expect(tmp.isExisted).toBe(true)
  await fs.dispose()
})

test('Test job response', async () => {
  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4001',
    runs: [
      {
        "exec'js": `
          await new Promise(r => setTimeout(r, 500))
          $parentState.jobRes.writeHead(200)
          $parentState.jobRes.write('ok')
        `
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    const resp = await axios.post('http://0.0.0.0:4001?jobRes=1')
    expect(resp.status).toBe(200)
    expect(resp.data).toBe('ok')
  }, 1000)
  await sub.exec()
})
