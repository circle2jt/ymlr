import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { type Vars } from '../vars/vars'
import { Scene } from './scene'

let scene: ElementProxy<Scene>
const tmp = new FileTemp()

tmp.create(`
vars:
  name: local name
runs:
  - scene'returns: Name is \${$vars.name}
`)

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
  tmp.remove()
})

test('should exports variables to result of scene', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
vars:
  name: My result
runs:
  - scene:
      path: ${tmp.file}
      vars:
        name: \${$vars.name}
    vars: sceneResult
`
  })
  await scene.exec() as Array<ElementProxy<Vars>>
  expect(scene.$.localVars.sceneResult).toBe('Name is My result')
})
