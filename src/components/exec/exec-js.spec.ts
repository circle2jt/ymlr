import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { ExecJs } from './exec-js'

let execJs: ExecJs

beforeEach(async () => {
  await Testing.reset()
})

afterAll(async () => {
  await execJs.dispose()
})

test('should be executed', async () => {
  const txt = 'hello world'
  execJs = await Testing.newElement(ExecJs, {
    title: 'Test function',
    script: `return '${txt}'`
  })
  const msg = await execJs.exec()
  expect(msg).toBe(txt)
})

test('should get value directly from global vars', async () => {
  Testing.vars.txt = 'hello world'
  execJs = await Testing.newElement(ExecJs, 'logger.info(\'Test here\'); return vars.txt')
  const msg = await execJs.exec()
  expect(msg).toBe(Testing.vars.txt)
})

test('should not get expression value from global vars', async () => {
  Testing.vars.txt = 'hello world'
  execJs = await Testing.newElement(ExecJs, 'return "${vars.txt}"')
  const msg = await execJs.exec()
  expect(msg).toBe('${vars.txt}')
})

test('should run from external file', async () => {
  const tmpFile = new FileTemp('.execJs')
  await tmpFile.create('logger.info(\'Test here\'); return vars.txt')
  try {
    Testing.vars.txt = 'hello world'
    execJs = await Testing.newElement(ExecJs, { path: tmpFile.file })
    const msg = await execJs.exec()
    expect(msg).toBe(Testing.vars.txt)
  } finally {
    tmpFile.remove()
  }
})
