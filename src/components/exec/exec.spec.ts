import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Exec } from './exec'

let exec: ElementProxy<Exec>
const tmpShFile = new FileTemp()

beforeEach(async () => {
  await Testing.reset()
  await tmpShFile.create('echo "sh here"')
})
afterEach(async () => {
  await exec.dispose()
})

afterAll(() => {
  tmpShFile.remove()
})

test('should be executed', async () => {
  exec = await Testing.createElementProxy(Exec, ['/bin/sh', tmpShFile.file])
  const { signal } = await exec.exec()
  expect(signal).toBeNull()
})
