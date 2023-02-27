import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { PackagesManager } from './packages-manager'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {

})

test('auto install external tags', async () => {
  const tagsManager = Testing.rootScene.tagsManager
  const packagesManager = new PackagesManager(Testing.logger)
  try {
    const newClass = await tagsManager.loadElementClass('lodash', Testing.rootScene)
    expect(newClass).toBeDefined()
  } catch {
    const [isInstalled] = packagesManager.getInstalledPackages('lodash')
    expect(isInstalled).toBeTruthy()
  } finally {
    await packagesManager.uninstall('lodash')
  }
})

test('load a new tag from a class in a external file', async () => {
  const tmpFile = new FileTemp('.js')
  try {
    tmpFile.create(`
    module.exports = class {
      constructor(props) {
        this.props = props
      }
      exec() {
        return this.props
      }
      dispose() { }
    }`)

    const data = { say: 'hello test' }
    Testing.rootScene.tagsManager.register('test1', tmpFile.file)

    const TestClass = await Testing.rootScene.tagsManager.loadElementClass('test1', Testing.rootScene)
    const test = await Testing.createElementProxy(TestClass, data)
    const rs = await test.exec()
    expect(rs).toEqual(data)
  } finally {
    tmpFile.remove()
  }
})

test('load a new tag from a object in a external file', async () => {
  const tmpFile = new FileTemp('.js')
  try {
    tmpFile.create(`
    module.exports = {
      constructor(props) {
        this.props = props
      },
      exec() {
        return this.props
      }
    }`)

    const data = { say: 'hello test' }
    Testing.rootScene.tagsManager.register('test1', tmpFile.file)

    const TestClass = await Testing.rootScene.tagsManager.loadElementClass('test1', Testing.rootScene)
    const test = await Testing.createElementProxy(TestClass, data)
    const rs = await test.exec()
    expect(rs).toEqual(data)
  } finally {
    tmpFile.remove()
  }
})
