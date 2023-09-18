import { dump } from 'js-yaml'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { FileRead } from './file-read'

let reader: ElementProxy<FileRead>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await reader.dispose()
})

test('Read text file', async () => {
  const tmp = new FileTemp()
  tmp.create('Hello world')
  try {
    reader = await Testing.createElementProxy(FileRead, {
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
  tmp.create(JSON.stringify({ msg: 'Hello world' }))
  try {
    reader = await Testing.createElementProxy(FileRead, {
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
  tmp.create(dump({ msg: 'Hello world' }))
  try {
    reader = await Testing.createElementProxy(FileRead, {
      path: tmp.file,
      format: 'yaml'
    })
    await reader.exec()
    expect(reader.result.msg).toBe('Hello world')
  } finally {
    tmp.remove()
  }
})
