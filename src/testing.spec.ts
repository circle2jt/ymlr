import { ElementProxy } from './components/element-proxy'
import { Group } from './components/group/group'
import { Testing } from './testing'

beforeEach(async () => {
  await Testing.reset()
})

test('test ram obj', async () => {
  const e = await Testing.createElementProxy(Group, [{
    echo: 'OK'
  }])
  const [echo] = await e.exec()
  expect(echo).toBeInstanceOf(ElementProxy)
  await e.dispose()
})
