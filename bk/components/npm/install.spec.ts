import { Testing } from 'src/testing'
import { Install } from './install'

let install: Install

beforeEach(async () => {
  await Testing.reset()
})
afterEach(async () => {
  await install.dispose()
})

test('should install librarries as an array input', async () => {
  const packsInstall = ['a', 'b', 'c']
  install = await Testing.newElement(Install, packsInstall)
  install.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsInstall)
  })
  await install.exec()
})

test('should install librarries as an full object', async () => {
  const packsInstall = ['a', 'b', 'c']
  install = await Testing.newElement(Install, packsInstall)
  install.action = jest.fn().mockImplementationOnce((...packs) => {
    expect(packs).toEqual(packsInstall)
  })
  await install.exec()
})
