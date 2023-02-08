import { Testing } from 'src/testing'

const data = { foo: 'bar' }

beforeEach(async () => {
  await Testing.reset()
})

test('push/get/clear a template in caches', () => {
  Testing.rootScene.templatesManager.pushToCached('test', data)
  expect(Testing.rootScene.templatesManager.getFromCached('test')).toEqual(data)
  Testing.rootScene.templatesManager.reset()
  expect(Testing.rootScene.templatesManager.getFromCached('test')).toBeUndefined()
})
