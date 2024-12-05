import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { YmlrLoad } from './ymlr-load'

let reader: ElementProxy<YmlrLoad>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await reader.dispose()
})

test('Read yaml file then handle include, replace variable data', async () => {
  const tmp = new FileTemp()
  const tmp1 = new FileTemp()
  tmp1.create('- echo: ${ $v.name }')
  tmp.create(`
vars:
  name: Local Name
runs:
  - include: ${tmp1.file}
`)
  try {
    Testing.vars.name = 'YMLR Name'
    reader = await Testing.createElementProxy(YmlrLoad, {
      path: tmp.file
    })
    await reader.exec()
    expect(reader.result.vars.name).toBe('Local Name')
    expect(reader.result.runs.length).toBe(1)
    expect(reader.result.runs[0].echo).toBe('YMLR Name')
  } finally {
    tmp.remove()
    tmp1.remove()
  }
})
