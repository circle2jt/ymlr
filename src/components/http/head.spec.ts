import { MockServer } from 'jest-mock-server'
import { Testing } from 'src/testing'
import { Head } from './head'

const server = new MockServer()
let request: Head

beforeAll(async () => await server.start())
afterAll(async () => await server.stop())
beforeEach(async () => {
  await Testing.reset()
  server.reset()
})
afterEach(async () => {
  await request.dispose()
})

test('should send request ok', async () => {
  server.head('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 201
      ctx.message = 'OK MEN'
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Head, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    vars: {
      status: '${this.response.status}',
      statusText: '${this.response.statusText}'
    }
  })
  await request.exec()
  expect(request.error).toBeUndefined()
  expect(Testing.vars.status).toBe(201)
  expect(Testing.vars.statusText).toBe('OK MEN')
})

test('should send request error', async () => {
  server.head('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 404
      ctx.message = 'NOT FOUND'
      expect(ctx.query.time).toBeDefined()
    })
  request = await Testing.newElement(Head, {
    url: server.getURL().toString() + '?time=' + Date.now().toString()
  })
  await request.exec()
  expect(request.error).toBeDefined()
  expect(request.response?.status).toBe(404)
  expect(request.response?.statusText).toBe('NOT FOUND')
})

test('should error before send request', async () => {
  server.head('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 201
      ctx.message = 'OK MEN'
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Head, {
    url: 'http://localhost',
    query: {
      rd: Math.random().toString()
    }
  })
  try {
    await request.exec()
  } catch (err) {
    expect(err).toBeDefined()
    expect(request.response).toBeUndefined()
  }
})
