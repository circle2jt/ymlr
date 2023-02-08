import group from './components/group'
import { Testing } from './testing'

test('test ram obj', async () => {
  const e = await Testing.newElement(group, [{
    echo: 'OK'
  }])
  await e.exec()
  await e.dispose()
})
