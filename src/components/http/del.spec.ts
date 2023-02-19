import { MockServer } from 'jest-mock-server'
import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Del } from './del'

const server = new MockServer()
let request: ElementProxy<Del>

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
      ctx.status = 204
      ctx.message = 'OK MEN'
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.createElementProxy(Del, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    }
  })
  await request.exec()
  expect(request.element.response?.status).toBe(204)
  expect(request.element.response?.statusText).toBe('OK MEN')
})
