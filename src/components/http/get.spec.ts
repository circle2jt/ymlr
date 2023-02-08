import { readFileSync } from 'fs'
import { MockServer } from 'jest-mock-server'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { Get } from './get'

const server = new MockServer()
let request: Get

beforeAll(async () => await server.start())
afterAll(async () => await server.stop())
beforeEach(async () => {
  await Testing.reset()
  server.reset()
})
afterEach(async () => {
  await request.dispose()
})

test('send a "get" request then get json data', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.get('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = bodyData
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Get, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    responseType: 'json',
    vars: {
      status: '${this.response.status}',
      statusText: '${this.response.statusText}',
      data: '${this.response.data}'
    }
  })
  await request.exec()
  expect(Testing.vars.status).toBe(200)
  expect(Testing.vars.statusText).toBe('OK MEN')
  expect(Testing.vars.data).toEqual(bodyData)
})

test('send a "get" request then get blob data', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.get('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = bodyData
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Get, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    responseType: 'blob',
    vars: 'data'
  })
  await request.exec()
  expect(Testing.vars.data).toBeInstanceOf(Blob)
})

test('send a "get" request then get arraybuffer data', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.get('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = bodyData
      ctx.set('custom', 'thanh')
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Get, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    responseType: 'buffer',
    vars: {
      status: '${this.response.status}',
      statusText: '${this.response.statusText}',
      data: '${this.response.data}',
      custom: '${this.response.headers?.custom}'
    }
  })
  await request.exec()
  expect(Testing.vars.status).toBe(200)
  expect(Testing.vars.statusText).toBe('OK MEN')
  expect(Testing.vars.custom).toBe('thanh')
  expect(Testing.vars.data).toBeInstanceOf(ArrayBuffer)
})

test('send a "get" request then ignore response data', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.get('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = bodyData
    })
  request = await Testing.newElement(Get, {
    url: server.getURL().toString(),
    responseType: 'none',
    vars: 'data'
  })
  await request.exec()
  expect(Testing.vars.data).toBeUndefined()
})

test('send a "get" request then get text data', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.get('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = bodyData
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Get, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    responseType: 'text',
    vars: {
      status: '${this.response.status}',
      statusText: '${this.response.statusText}',
      data: '${this.response.data}'
    }
  })
  await request.exec()
  expect(Testing.vars.status).toBe(200)
  expect(Testing.vars.statusText).toBe('OK MEN')
  expect(typeof Testing.vars.data).toBe('string')
})

test('should download a file', async () => {
  const tmp = new FileTemp()
  try {
    const bodyData = 'thanh'
    server.get('/')
      .mockImplementationOnce((ctx) => {
        ctx.status = 200
        ctx.message = 'OK MEN'
        ctx.body = bodyData
      })
    request = await Testing.newElement(Get, {
      url: server.getURL().toString(),
      saveTo: tmp.file
    })
    await request.exec()
    const fileContent = readFileSync(tmp.file).toString()
    expect(fileContent).toBe(bodyData)
  } finally {
    tmp.remove()
  }
})
