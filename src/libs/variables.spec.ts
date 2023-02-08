import { Testing } from 'src/testing'

beforeEach(async () => {
  await Testing.reset()
})

test('set value to a variable to global', async () => {
  expect(Testing.vars.name).toBeUndefined()
  await Testing.rootScene.setVars('name', 'thanh')
  expect(Testing.vars.name).toBe('thanh')
})

test('set a map value to variable to global', async () => {
  expect(Testing.vars.name).toBeUndefined()
  await Testing.rootScene.setVars({
    name: '${this.name}'
  }, undefined, {
    name: 'thanh'
  })
  expect(Testing.vars.name).toBe('thanh')
})

test('get value from a variable in global without context', async () => {
  Testing.vars.name = 'thanh'
  const name = await Testing.rootScene.getVars('${vars.name}')
  expect(name).toBe('thanh')
})

test('get value from a variable in global with context', async () => {
  Testing.vars.name = 'thanh'
  const ctx = {
    sex: 'male'
  }
  const name = await Testing.rootScene.getVars('${vars.name}', ctx)
  const sex = await Testing.rootScene.getVars('${this.sex}', ctx)
  expect(name).toBe('thanh')
  expect(sex).toBe('male')
})

test('get value from a value which ref to another', async () => {
  Testing.vars.last = 'doan'
  Testing.vars.name = 'thanh ${vars.last}'
  const name = await Testing.rootScene.getVars('${vars.name}')
  expect(name).toBe('thanh doan')
})

test('get map value', async () => {
  Testing.vars.hobies = ['game', 'travel']
  Testing.vars.user = {
    name: 'thanh'
  }
  const { name, last, hobby } = await Testing.rootScene.getVars({
    name: '${vars.user.name}',
    last: 'doan',
    hobby: ['bia', '${vars.hobies[1]}']
  })
  expect(name).toBe('thanh')
  expect(last).toBe('doan')
  expect(hobby).toStrictEqual(['bia', 'travel'])
})
