import { Testing } from 'src/testing'
import { RootScene } from '../root-scene'
import { Scene } from '../scene/scene'

let scene!: Scene

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
})

test('continue should stop the next steps', async () => {
  scene = new RootScene({
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
  }, Testing.logger)
  await scene.exec()
  expect(scene.localVars.step).toBe(1)
})
