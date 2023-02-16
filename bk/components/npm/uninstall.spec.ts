import { Testing } from 'src/testing'
import { Uninstall } from './uninstall'

let uninstall: Uninstall

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await uninstall.dispose()
})

test('should uninstall librarries as an array input', async () => {
  const packsUninstall = ['a', 'b', 'c']
  uninstall = await Testing.newElement(Uninstall, packsUninstall)
  uninstall.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsUninstall)
  })
  await uninstall.exec()
})

test('should uninstall librarries as an full object', async () => {
  const packsUninstall = ['a', 'b', 'c']
  uninstall = await Testing.newElement(Uninstall, packsUninstall)
  uninstall.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsUninstall)
  })
  await uninstall.exec()
})
