import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Uninstall } from './uninstall'

let uninstall: ElementProxy<Uninstall>

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await uninstall.dispose()
})

test('should uninstall librarries as an array input', async () => {
  const packsUninstall = ['a', 'b', 'c']
  uninstall = await Testing.createElementProxy(Uninstall, packsUninstall)
  uninstall.element.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsUninstall)
  })
  await uninstall.exec()
})

test('should uninstall librarries as an full object', async () => {
  const packsUninstall = ['a', 'b', 'c']
  uninstall = await Testing.createElementProxy(Uninstall, packsUninstall)
  uninstall.element.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsUninstall)
  })
  await uninstall.exec()
})
