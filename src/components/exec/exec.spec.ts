import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Exec } from './exec'

let exec: ElementProxy<Exec>
const tmpShFile = new FileTemp()

beforeEach(async () => {
  await Testing.reset()
  tmpShFile.create('echo "sh here"')
})
afterEach(async () => {
  await exec.dispose()
})

afterAll(() => {
  tmpShFile.remove()
})

test('should be executed', async () => {
  exec = await Testing.createElementProxy(Exec, ['/bin/sh', tmpShFile.file])
  const { signal, logs } = await exec.exec()
  expect(signal).toBeNull()
  expect(logs).toBeUndefined()
})

test('should be executed and return logs', async () => {
  exec = await Testing.createElementProxy(Exec, ['/bin/sh', tmpShFile.file], {
    vars: 'log'
  })
  const { signal, logs } = await exec.exec()
  expect(signal).toBeNull()
  expect(logs).toBe('sh here')
})
