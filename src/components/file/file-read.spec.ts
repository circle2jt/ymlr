import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { stringify } from 'yaml'
import { FileRead } from './file-read'

let reader: FileRead

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await reader.dispose()
})

test('Read text file', async () => {
  const tmp = new FileTemp()
  await tmp.create('Hello world')
  try {
    reader = await Testing.newElement(FileRead, {
      path: tmp.file,
      vars: {
        msg: '${this.result}'
      }
    })
    await reader.exec()
    expect(Testing.vars.msg).toBe('Hello world')
  } finally {
    tmp.remove()
  }
})

test('Read json file', async () => {
  const tmp = new FileTemp()
  await tmp.create(JSON.stringify({ msg: 'Hello world' }))
  try {
    reader = await Testing.newElement(FileRead, {
      path: tmp.file,
      format: 'json',
      vars: {
        msg: '${this.result.msg}'
      }
    })
    await reader.exec()
    expect(Testing.vars.msg).toBe('Hello world')
  } finally {
    tmp.remove()
  }
})

test('Read yaml file', async () => {
  const tmp = new FileTemp()
  await tmp.create(stringify({ msg: 'Hello world' }))
  try {
    reader = await Testing.newElement(FileRead, {
      path: tmp.file,
      format: 'yaml',
      vars: 'data'
    })
    await reader.exec()
    expect(Testing.vars.data.msg).toBe('Hello world')
  } finally {
    tmp.remove()
  }
})
