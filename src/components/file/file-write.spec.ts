import { existsSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Testing } from 'src/testing'
import { parse } from 'yaml'
import { ElementProxy } from '../element-proxy'
import { FileWrite } from './file-write'

let writer: ElementProxy<FileWrite>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await writer.dispose()
})

test('Write text file', async () => {
  const p = join(tmpdir(), Math.random().toString())
  try {
    writer = await Testing.createElementProxy(FileWrite, {
      path: p,
      content: 'Hello world'
    })
    await writer.exec()
    expect(existsSync(p)).toBe(true)
    const msg = readFileSync(p).toString('utf-8')
    expect(msg).toBe('Hello world')
  } finally {
    unlinkSync(p)
  }
})

test('Write json file', async () => {
  const p = join(tmpdir(), Math.random().toString())
  try {
    writer = await Testing.createElementProxy(FileWrite, {
      path: p,
      format: 'json',
      content: {
        msg: 'Hello world'
      }
    })
    await writer.exec()
    expect(existsSync(p)).toBe(true)
    const obj = JSON.parse(readFileSync(p).toString('utf-8'))
    expect(obj.msg).toBe('Hello world')
  } finally {
    unlinkSync(p)
  }
})

test('Write json file with pretty mode', async () => {
  const p = join(tmpdir(), Math.random().toString())
  try {
    writer = await Testing.createElementProxy(FileWrite, {
      path: p,
      format: 'json',
      pretty: true,
      content: {
        msg: 'Hello world'
      }
    })
    await writer.exec()
    expect(existsSync(p)).toBe(true)
    const msg = readFileSync(p).toString('utf-8')
    expect(msg).toBe('{\n  "msg": "Hello world"\n}')
  } finally {
    unlinkSync(p)
  }
})

test('Write yaml file', async () => {
  const p = join(tmpdir(), Math.random().toString())
  try {
    writer = await Testing.createElementProxy(FileWrite, {
      path: p,
      format: 'yaml',
      content: {
        msg: 'Hello world'
      }
    })
    await writer.exec()
    expect(existsSync(p)).toBe(true)
    const obj = parse(readFileSync(p).toString('utf-8'))
    expect(obj.msg).toBe('Hello world')
  } finally {
    unlinkSync(p)
  }
})
