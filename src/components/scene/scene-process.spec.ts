import { existsSync, readFileSync } from 'fs'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { SceneProcess } from './scene-process'

let sceneProcess: ElementProxy<SceneProcess>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await sceneProcess.dispose()
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
    sceneProcess = await Testing.createElementProxy(SceneProcess, {
      path: tmp.file
    })
    await sceneProcess.exec()
    expect(existsSync(tmp.file))
    expect(readFileSync(tmp.file).toString()).toBe('hello')
  } finally {
    tmp.remove()
  }
})
