import { MockServer } from 'jest-mock-server'
import Koa from 'koa'
import koaBody from 'koa-body'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { Post } from './post'

const server = new MockServer({
  buildApp() {
    const app = new Koa()
    app.use(koaBody({ multipart: true }))
    return app
  }
})
let request: Post

beforeAll(async () => await server.start())
afterAll(async () => await server.stop())
beforeEach(async () => {
  await Testing.reset()
  server.reset()
})
afterEach(async () => {
  await request.dispose()
})

test('post a json request ok', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.post('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = ctx.request.body
      expect(ctx.query.time).toBeDefined()
      expect(ctx.query.rd).toBeDefined()
    })
  request = await Testing.newElement(Post, {
    url: server.getURL().toString() + '?time=' + Date.now().toString(),
    query: {
      rd: Math.random().toString()
    },
    responseType: 'json',
    type: 'json',
    body: bodyData,
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

test('post a form request ok', async () => {
  const bodyData = {
    name: 'thanh',
    sex: 'male'
  }
  server.post('/')
    .mockImplementationOnce((ctx) => {
      ctx.status = 200
      ctx.message = 'OK MEN'
      ctx.body = ctx.request.body
    })
  request = await Testing.newElement(Post, {
    url: server.getURL().toString(),
    responseType: 'json',
    type: 'form',
    body: bodyData,
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

test('post a text request ok', async () => {
  const bodyData = 'hello world'
  server.post('/')
    .mockImplementationOnce((ctx) => {
      expect(ctx.request.body).toBe(bodyData)
    })
  request = await Testing.newElement(Post, {
    url: server.getURL().toString(),
    responseType: 'none',
    type: 'text',
    body: bodyData
  })
  await request.exec()
})

test('post a raw request ok', async () => {
  const bodyData = 'hello world'
  server.post('/')
    .mockImplementationOnce((ctx) => {
      expect(ctx.request.body).toBe(bodyData)
    })
  request = await Testing.newElement(Post, {
    url: server.getURL().toString(),
    responseType: 'none',
    type: 'raw',
    body: bodyData,
    vars: {
      status: '${this.response.status}',
      statusText: '${this.response.statusText}',
      data: '${this.response.data}'
    }
  })
  await request.exec()
})

test('upload a file ok', async () => {
  const tmp = new FileTemp()
  await tmp.create('hello')
  try {
    const bodyData = {
      name: 'thanh',
      sex: 'male',
      avatar: {
        path: tmp.file,
        name: 'hello.txt'
      }
    }
    server.post('/')
      .mockImplementationOnce((ctx) => {
        ctx.body = ctx.request.body
        expect(ctx.request.body).toBeDefined()
        const { avatar, ...form } = bodyData
        expect(ctx.request.body).toEqual(form)
        expect(ctx.request.files?.avatar).toBeDefined()
      })
    request = await Testing.newElement(Post, {
      url: server.getURL().toString(),
      responseType: 'json',
      type: 'multipart',
      body: bodyData
    })
    await request.exec()
  } finally {
    tmp.remove()
  }
})

test('post a request without body ok', async () => {
  const bodyData = undefined
  server.post('/')
    .mockImplementationOnce((ctx) => {
      ctx.body = 'ok'
    })
  request = await Testing.newElement(Post, {
    url: server.getURL().toString(),
    responseType: 'text',
    type: 'raw',
    body: bodyData
  })
  await request.exec()
  expect(request.response?.data).toBe('ok')
})
