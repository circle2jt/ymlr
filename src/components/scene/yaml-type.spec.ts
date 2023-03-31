import { unlinkSync } from 'fs'
import { Testing } from 'src/testing'
import { Echo } from '../echo/echo'
import { ElementProxy } from '../element-proxy'
import { Scene } from './scene'

let scene: ElementProxy<Scene>
let encryptedFile: string

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
})

afterAll(() => {
  encryptedFile && unlinkSync(encryptedFile)
})

test('Should load custom tags', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
- vars:
    regex: !regex /\\d+/
`
  })
  await scene.exec() as Array<ElementProxy<Echo>>
  expect(scene.element.localVars.regex).toBeInstanceOf(RegExp)
})
