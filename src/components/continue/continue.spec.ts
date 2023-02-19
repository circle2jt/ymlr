import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Scene } from '../scene/scene'

let scene: ElementProxy<Scene>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
})

test('continue should stop the next steps', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
vars:
  step: 0
runs:
  - exec'js: |
      vars.step = 1
  - continue:
  - exec'js: |
      vars.step = 2
`
  })
  await scene.exec()
  expect(scene.element.localVars.step).toBe(1)
})
