import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Test } from './test'
import { type TestError } from './test-error'

let testElem: ElementProxy<Test>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await testElem.dispose()
})

test('test simple case', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, '${$vars.i >= 10}')
  const testError = await testElem.exec()
  expect(testError).toBe(undefined)
})

test('test with "check" prop', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, {
    check: '${$vars.i >= 10}'
  })
  testElem.name = 'Greater than 10'
  const testError = await testElem.exec()
  expect(testError).toBe(undefined)
})

test('test with "script" prop', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, {
    script: '$vars.i >= 10'
  })
  testElem.name = 'Greater than 10'
  const testError = await testElem.exec()
  expect(testError).toBe(undefined)
})

test('quick test failed', async () => {
  Testing.vars.i = 9
  testElem = await Testing.createElementProxy(Test, {
    check: '${$vars.i >= 10}'
  })
  testElem.name = 'Greater than 10'

  let err: TestError | undefined
  try {
    await testElem.exec()
  } catch (error: any) {
    err = error
  }
  expect(err).toBeDefined()
  expect(err?.message).toBe('Greater than 10')
  expect(err?.cause).toBe('${$vars.i >= 10}')
})

test('test with a script failed then print error detail but keep playing, not stop', async () => {
  Testing.vars.i = 9
  const mes = 'i is less than 10'
  testElem = await Testing.createElementProxy(Test, {
    script: `if ($vars.i < 10) throw new Error('${mes}')`,
    stopWhenFailed: false
  })
  testElem.name = 'Greater than 10'

  const err = await testElem.exec()
  expect(err).toBeDefined()
  expect(err?.message).toBe('Greater than 10')
  expect(err?.cause).toBe('i is less than 10')
})
