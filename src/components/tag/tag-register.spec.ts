import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { TagRegister } from './tag-register'

beforeEach(async () => {
  await Testing.reset()
})

test('Register a tag from a file', async () => {
  const tmp = new FileTemp()
  try {
    await tmp.create(`
    module.exports = {
      constructor(props) {
        Object.assign(this, props)
      },
      exec() {
        this.logger.debug(this.name)
      },
      dispose() { }
    }`)
    const trProxy = await Testing.createElementProxy(TagRegister, {
      tag1: tmp.file
    })
    await trProxy.exec()
    await trProxy.dispose()
    const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
    expect(Clazz).toBeDefined()
    const tag1Proxy = await Testing.createElementProxy(Clazz, {})
    expect(tag1Proxy.tag).toBe('tag1')
  } finally {
    tmp.remove()
  }
})

test('Register a tag from an object', async () => {
  const trProxy = await Testing.createElementProxy(TagRegister, {
    tag1: `{
        constructor(props) {
          Object.assign(this, props)
        },
        exec() {
          this.logger.debug(this.name)
        },
        dispose() { }
      }`
  })
  await trProxy.exec()
  await trProxy.dispose()
  const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
  expect(Clazz).toBeDefined()
  const tag1Proxy: ElementProxy<any> = await Testing.createElementProxy(Clazz, { foo: 'bar' })
  expect(tag1Proxy.tag).toBe('tag1')
  expect(tag1Proxy.element.foo).toBe('bar')
})

test('Register a tag from a class', async () => {
  const trProxy = await Testing.createElementProxy(TagRegister, {
    tag1: `class MyTag {
        constructor(props) {
          Object.assign(this, props)
        }
        exec() {
          this.logger.debug(this.name)
        }
        dispose() { }
      }`
  })
  await trProxy.exec()
  await trProxy.dispose()
  const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
  expect(Clazz).toBeDefined()
  const tag1Proxy: ElementProxy<any> = await Testing.createElementProxy(Clazz, { foo: 'bar' })
  expect(tag1Proxy.tag).toBe('tag1')
  expect(tag1Proxy.element.foo).toBe('bar')
})
