import { existsSync, readFileSync } from 'fs'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { SceneThread } from './scene-thread'

let sceneThread: ElementProxy<SceneThread>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await sceneThread.dispose()
})

afterAll(() => {
})

test.skip('should execute successfully', async () => {
  const tmp = new FileTemp()
  tmp.create(`
- file'write:
    content: hello
    path: ${tmp.file}
`)
  try {
    sceneThread = await Testing.createElementProxy(SceneThread, {
      path: tmp.file
    })
    await sceneThread.exec()
    expect(existsSync(tmp.file))
    expect(readFileSync(tmp.file).toString()).toBe('hello')
  } finally {
    tmp.remove()
  }
})
