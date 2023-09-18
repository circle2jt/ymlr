import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Exit } from './exit'

let exit: ElementProxy<Exit>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await exit.dispose()
})

test('exit() should be called', async () => {
  exit = await Testing.createElementProxy(Exit)
  exit.element.exit = jest.fn()
  await exit.exec()
  expect(exit.element.exit).toBeCalled()
  expect(exit.result).toBe(0)
})

test('exit() with custom code', async () => {
  exit = await Testing.createElementProxy(Exit, 1)
  exit.element.exit = jest.fn()
  await exit.exec()
  expect(exit.element.exit).toBeCalled()
  expect(exit.result).toBe(1)
})
