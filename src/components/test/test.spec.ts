import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Test } from './test'

let testElem: ElementProxy<Test>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await testElem.dispose()
})

test('quick test without title', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, '${vars.i >= 10}')
  const rs = await testElem.exec()
  expect(rs.passed).toBe(true)
})

test('test script without title', async () => {
  Testing.vars.i = 9
  testElem = await Testing.createElementProxy(Test, {
    check: '${vars.i >= 10}'
  })
  const rs = await testElem.exec()
  expect(rs.passed).toBe(false)
  expect(rs.error?.message).toBe('')
})

test('quick test', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, {
    title: 'Greater than 10',
    check: '${vars.i >= 10}'
  })
  const rs = await testElem.exec()
  expect(rs.passed).toBe(true)
})

test('test with a script', async () => {
  Testing.vars.i = 11
  testElem = await Testing.createElementProxy(Test, {
    title: 'Greater than 10',
    script: 'vars.i >= 10'
  })
  const rs = await testElem.exec()
  expect(rs.passed).toBe(true)
})

test('quick test failed', async () => {
  Testing.vars.i = 9
  testElem = await Testing.createElementProxy(Test, {
    title: 'Greater than 10',
    check: '${vars.i >= 10}'
  })
  const rs = await testElem.exec()
  expect(rs.passed).toBe(false)
  expect(rs.error?.message).toBe('')
})

test('test with a script failed then print error detail', async () => {
  Testing.vars.i = 9
  const mes = 'i is less than 10'
  testElem = await Testing.createElementProxy(Test, {
    title: 'Greater than 10',
    script: `if (vars.i < 10) this.failed('${mes}')`
  })
  const rs = await testElem.exec()
  expect(rs.passed).toBe(false)
  expect(rs.error?.message).toBe(mes)
})
