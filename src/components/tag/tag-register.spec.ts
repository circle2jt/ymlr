import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { TagRegister } from './tag-register'

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
    const tr = await Testing.newElement(TagRegister, {
      tag1: tmp.file
    })
    await tr.exec()
    await tr.dispose()
    const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
    expect(Clazz).toBeDefined()
    const tag1 = await Testing.newElement(Clazz, {})
    expect(tag1.$$tag).toBe('tag1')
  } finally {
    tmp.remove()
  }
})

test('Register a tag from an object', async () => {
  const tr = await Testing.newElement(TagRegister, {
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
  await tr.exec()
  await tr.dispose()
  const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
  expect(Clazz).toBeDefined()
  const tag1: any = await Testing.newElement(Clazz, { foo: 'bar' })
  expect(tag1.$$tag).toBe('tag1')
  expect(tag1.foo).toBe('bar')
})

test('Register a tag from a class', async () => {
  const tr = await Testing.newElement(TagRegister, {
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
  await tr.exec()
  await tr.dispose()
  const Clazz = await Testing.rootScene.tagsManager.loadElementClass('tag1', Testing.rootScene)
  expect(Clazz).toBeDefined()
  const tag1: any = await Testing.newElement(Clazz, { foo: 'bar' })
  expect(tag1.$$tag).toBe('tag1')
  expect(tag1.foo).toBe('bar')
})
