import { MockServer } from 'jest-mock-server'
import { Testing } from 'src/testing'
import { Del } from './del'

const server = new MockServer()
let request: Del

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
  server.delete('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 201
      ctx.message = 'OK MEN'
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Del, {
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
  expect(Testing.vars.status).toBe(201)
  expect(Testing.vars.statusText).toBe('OK MEN')
})
