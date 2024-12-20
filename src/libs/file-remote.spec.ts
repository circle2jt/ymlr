import { MockServer } from 'jest-mock-server'
import { Testing } from 'src/testing'
import { FileRemote } from './file-remote'
import { FileTemp } from './file-temp'

beforeEach(async () => {
  await Testing.reset()
})

test('should get content if input is a file', async () => {
  const tempFile = new FileTemp()
  try {
    tempFile.create('ok')
    const f = new FileRemote(tempFile.file, Testing.rootScene.proxy)
    expect(f.isRemote).toBe(false)
    expect(f.existed).toBe(true)
    expect((await f.getContent()).toString()).toBe('ok')
    expect(await f.getTextContent()).toBe('ok')
  } finally {
    tempFile.remove()
  }
})

test('should get content if input is a url', async () => {
  const server = new MockServer()
  server.get('/')
    .mockImplementation((ctx) => {
      ctx.status = 200
      ctx.body = 'ok'
    })
  try {
    await server.start()
    const f = new FileRemote(server.getURL().toString(), Testing.rootScene.proxy)
    expect(f.isRemote).toBe(true)
    expect(f.existed).toBeUndefined()
    expect((await f.getContent()).toString()).toBe('ok')
    expect(await f.getTextContent()).toBe('ok')
  } finally {
    await server.stop()
  }
})
