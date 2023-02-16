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
    responseType: 'json'
  })
  await request.exec()
  expect(request.response?.status).toBe(200)
  expect(request.response?.statusText).toBe('OK MEN')
  expect(request.response?.data).toEqual(bodyData)
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
    responseType: 'blob'
  })
  await request.exec()
  expect(request.response?.data).toBeInstanceOf(Blob)
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
    responseType: 'buffer'
  })
  await request.exec()
  expect(request.response?.status).toBe(200)
  expect(request.response?.statusText).toBe('OK MEN')
  expect(request.response?.headers?.custom).toBe('thanh')
  expect(request.response?.data).toBeInstanceOf(ArrayBuffer)
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
    responseType: 'none'
  })
  await request.exec()
  expect(request.response?.data).toBeUndefined()
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
    responseType: 'text'
  })
  await request.exec()
  expect(request.response?.status).toBe(200)
  expect(request.response?.statusText).toBe('OK MEN')
  expect(typeof request.response?.data).toBe('string')
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
