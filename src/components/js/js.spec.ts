import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Js } from './js'

let js: ElementProxy<Js>

beforeEach(async () => {
  await Testing.reset()
})

afterAll(async () => {
  await js.dispose()
})

test('should be executed', async () => {
  const txt = 'hello world'
  js = await Testing.createElementProxy(Js, {
    script: `return '${txt}'`
  })
  const msg = await js.exec()
  expect(msg).toBe(txt)
})

test('should get value directly from global vars', async () => {
  Testing.vars.txt = 'hello world'
  js = await Testing.createElementProxy(Js, 'this.logger.info(\'Test here\'); return $vars.txt')
  const msg = await js.exec()
  expect(msg).toBe(Testing.vars.txt)
})

test('should not get expression value from global vars', async () => {
  Testing.vars.txt = 'hello world'
  js = await Testing.createElementProxy(Js, 'return "${$vars.txt}"')
  const msg = await js.exec()
  expect(msg).toBe('${$vars.txt}')
})

test('should run from external file', async () => {
  const tmpFile = new FileTemp('.js')
  tmpFile.create('this.logger.info(\'Test here\'); return $vars.txt')
  try {
    Testing.vars.txt = 'hello world'
    js = await Testing.createElementProxy(Js, { path: tmpFile.file })
    const msg = await js.exec()
    expect(msg).toBe(Testing.vars.txt)
  } finally {
    tmpFile.remove()
  }
})
