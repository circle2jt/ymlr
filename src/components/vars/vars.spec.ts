import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Vars } from './vars'

let vars: ElementProxy<Vars>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await vars?.dispose()
})

test('should set to local vars which is used in the scene', async () => {
  try {
    vars = await Testing.createElementProxy(Vars, {
      string: 'foo',
      number: 1,
      boolean: true,
      object: {
        string: 'foo',
        number: 1,
        boolean: true
      },
      array1: [1, '2', true],
      array2: [{
        string: 'foo',
        number: 1,
        boolean: true
      }]
    })
    expect(Testing.vars.String).toBeUndefined()
    expect(Testing.vars.Number).toBeUndefined()
    expect(Testing.vars.Boolean).toBeUndefined()
    expect(Testing.vars.Object).toBeUndefined()
    expect(Testing.vars.Array1).toBeUndefined()
    expect(Testing.vars.Array2).toBeUndefined()

    expect(Testing.vars.string).toBeUndefined()
    expect(Testing.vars.number).toBeUndefined()
    expect(Testing.vars.boolean).toBeUndefined()
    expect(Testing.vars.object).toBeUndefined()
    expect(Testing.vars.array1).toBeUndefined()
    expect(Testing.vars.array2).toBeUndefined()
    await vars.exec()
    expect(Testing.vars.string).toBe('foo')
    expect(Testing.vars.number).toBe(1)
    expect(Testing.vars.boolean).toBe(true)
    expect(Testing.vars.object).toStrictEqual({
      string: 'foo',
      number: 1,
      boolean: true
    })
    expect(Testing.vars.array1).toStrictEqual([1, '2', true])
    expect(Testing.vars.array2).toStrictEqual([{
      string: 'foo',
      number: 1,
      boolean: true
    }])

    expect(Testing.vars.String).toBeUndefined()
    expect(Testing.vars.Number).toBeUndefined()
    expect(Testing.vars.Boolean).toBeUndefined()
    expect(Testing.vars.Object).toBeUndefined()
    expect(Testing.vars.Array1).toBeUndefined()
    expect(Testing.vars.Array2).toBeUndefined()
  } finally {
    await vars.dispose()
  }
})

test('should set to global vars', async () => {
  try {
    vars = await Testing.createElementProxy(Vars, {
      String: 'foo',
      Number: 1,
      Boolean: true,
      Object: {
        string: 'foo',
        number: 1,
        boolean: true
      },
      Array1: [1, '2', true],
      Array2: [{
        string: 'foo',
        number: 1,
        boolean: true
      }]
    })
    expect(Testing.vars.String).toBeUndefined()
    expect(Testing.vars.Number).toBeUndefined()
    expect(Testing.vars.Boolean).toBeUndefined()
    expect(Testing.vars.Object).toBeUndefined()
    expect(Testing.vars.Array1).toBeUndefined()
    expect(Testing.vars.Array2).toBeUndefined()

    expect(Testing.vars.string).toBeUndefined()
    expect(Testing.vars.number).toBeUndefined()
    expect(Testing.vars.boolean).toBeUndefined()
    expect(Testing.vars.object).toBeUndefined()
    expect(Testing.vars.array1).toBeUndefined()
    expect(Testing.vars.array2).toBeUndefined()
    await vars.exec()
    expect(Testing.vars.String).toBe('foo')
    expect(Testing.vars.Number).toBe(1)
    expect(Testing.vars.Boolean).toBe(true)
    expect(Testing.vars.Object).toStrictEqual({
      string: 'foo',
      number: 1,
      boolean: true
    })
    expect(Testing.vars.Array1).toStrictEqual([1, '2', true])
    expect(Testing.vars.Array2).toStrictEqual([{
      string: 'foo',
      number: 1,
      boolean: true
    }])

    expect(Testing.vars.string).toBeUndefined()
    expect(Testing.vars.number).toBeUndefined()
    expect(Testing.vars.boolean).toBeUndefined()
    expect(Testing.vars.object).toBeUndefined()
    expect(Testing.vars.array1).toBeUndefined()
    expect(Testing.vars.array2).toBeUndefined()
  } finally {
    await vars.dispose()
  }
})

test('should eval value into vars', async () => {
  vars = await Testing.createElementProxy(Vars, {
    name: 'scene name',
    Name: 'global name'
  })
  await vars.exec()

  const test = await Testing.createElementProxy(Vars, {
    Hello: 'Hello ${$vars.Name}',
    hello: 'hello ${$vars.name}'
  })
  await test.exec()
  await test.dispose()

  expect(Testing.vars.hello).toBe('hello scene name')
  expect(Testing.vars.Hello).toBe('Hello global name')
})
