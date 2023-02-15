import { existsSync, unlinkSync } from 'fs'
import { FileTemp } from 'src/libs/file-temp'
import { formatFileName } from 'src/libs/format'
import { Testing } from 'src/testing'
import { ExecSh } from './exec-sh'

let execSh: ExecSh

beforeEach(async () => {
  await Testing.reset()
})

afterAll(async () => {
  await execSh.dispose()
})

test('should create a new file', async () => {
  const path = `/tmp/${formatFileName('No Say Ben( Remix ) | Cover Bố Mẹ Gấu | VanhLeg')}.mp3`
  try {
    execSh = await Testing.newElement(ExecSh, {
      script: `touch "${path}"`
    })
    await execSh.exec()
    expect(existsSync(path)).toBe(true)
  } finally {
    existsSync(path) && unlinkSync(path)
  }
})

test('should be executed', async () => {
  const txt = 'hello world'
  execSh = await Testing.newElement(ExecSh, {
    script: `echo "${txt}"`
  })
  const msg = await execSh.exec()
  expect(msg).toBe(txt)
})

test('should get expression value from global vars', async () => {
  Testing.vars.txt = 'hello world'
  execSh = await Testing.newElement(ExecSh, 'echo "${vars.txt}"')
  const msg = await execSh.exec()
  expect(msg).toBe(Testing.vars.txt)
})

test('should run from external file', async () => {
  const txt = 'hello world'
  const tmpFile = new FileTemp('.execSh')
  await tmpFile.create(`echo "${txt}"`)
  try {
    execSh = await Testing.newElement(ExecSh, {
      path: tmpFile.file
    })
    const msg = await execSh.exec()
    expect(msg).toBe(txt)
  } finally {
    tmpFile.remove()
  }
})
