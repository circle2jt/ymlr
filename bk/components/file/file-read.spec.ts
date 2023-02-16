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
      path: tmp.file
    })
    await reader.exec()
    expect(reader.result).toBe('Hello world')
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
      format: 'json'
    })
    await reader.exec()
    expect(reader.result.msg).toBe('Hello world')
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
      format: 'yaml'
    })
    await reader.exec()
    expect(reader.result.msg).toBe('Hello world')
  } finally {
    tmp.remove()
  }
})
