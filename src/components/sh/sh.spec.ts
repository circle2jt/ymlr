import { existsSync, unlinkSync } from 'fs'
import { FileTemp } from 'src/libs/file-temp'
import { formatFileName } from 'src/libs/format'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Sh } from './sh'

let sh: ElementProxy<Sh>

beforeEach(async () => {
  await Testing.reset()
})

afterAll(async () => {
  await sh.dispose()
})

test('should create a new file', async () => {
  const path = `/tmp/${formatFileName('No Say Ben( Remix ) | Cover Bố Mẹ Gấu | VanhLeg')}.mp3`
  try {
    sh = await Testing.createElementProxy(Sh, {
      script: `touch "${path}"`
    })
    await sh.exec()
    expect(existsSync(path)).toBe(true)
  } finally {
    existsSync(path) && unlinkSync(path)
  }
})

test('should be executed', async () => {
  const txt = 'hello world'
  sh = await Testing.createElementProxy(Sh, {
    script: `echo "${txt}"`
  }, {
    vars: 'log'
  })
  const msg = await sh.exec()
  expect(msg).toBe(txt)
  expect(Testing.vars.log).toBe(txt)
})

test('should get expression value from global vars', async () => {
  Testing.vars.txt = 'hello world'
  sh = await Testing.createElementProxy(Sh, 'echo "${$vars.txt}"', {
    vars: 'log'
  })
  const msg = await sh.exec()
  expect(msg).toBe(Testing.vars.txt)
  expect(Testing.vars.log).toBe(Testing.vars.txt)
})

test('should not trace logs when not set vars', async () => {
  Testing.vars.txt = 'hello world'
  sh = await Testing.createElementProxy(Sh, 'echo "${$vars.txt}"')
  const msg = await sh.exec()
  expect(msg).toBeUndefined()
})

test('should run from external file', async () => {
  const txt = 'hello world'
  const tmpFile = new FileTemp('.sh')
  tmpFile.create(`echo "${txt}"`)
  try {
    sh = await Testing.createElementProxy(Sh, {
      path: tmpFile.file
    }, {
      vars: 'log'
    })
    const msg = await sh.exec()
    expect(msg).toBe(txt)
    expect(Testing.vars.log).toBe(txt)
  } finally {
    tmpFile.remove()
  }
})
