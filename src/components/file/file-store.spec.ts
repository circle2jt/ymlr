import { readFileSync } from 'fs'
import { AES } from 'src/libs/encrypt/aes'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { FileStore } from './file-store'

let storage: ElementProxy<FileStore>
let tmp: FileTemp

beforeEach(async () => {
  await Testing.reset()
  tmp = new FileTemp()
})

afterEach(async () => {
  await storage.dispose()
  tmp.remove()
})

test('Load with init data', async () => {
  const initData = ['init data']
  storage = await Testing.createElementProxy(FileStore, {
    path: tmp.file,
    initData
  })
  const rs = await storage.exec()
  expect(rs).toBe(initData)
})

test('Add new data & save to file', async () => {
  storage = await Testing.createElementProxy(FileStore, {
    path: tmp.file,
    initData: []
  })
  const initData = await storage.exec()
  expect(initData).toStrictEqual([])
  storage.element.data.push('new item')
  storage.element.save()
  const newData = storage.element.load()
  expect(newData).toStrictEqual(['new item'])
})

test('Encrypt data file with a password', async () => {
  storage = await Testing.createElementProxy(FileStore, {
    path: tmp.file,
    password: 'pwd',
    initData: ['name 1']
  })
  const initData = await storage.exec()
  expect(initData).toStrictEqual(['name 1'])

  const cnt = readFileSync(tmp.file).toString()
  const decryptData = JSON.parse(new AES('pwd').decrypt(cnt))
  expect(decryptData).toStrictEqual(['name 1'])
})
