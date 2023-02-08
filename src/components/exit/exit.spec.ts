import { Testing } from 'src/testing'
import { Exit } from './exit'

let exit: Exit

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await exit.dispose()
})

test('exit() should be called', async () => {
  exit = await Testing.newElement(Exit)
  exit.exit = jest.fn()
  await exit.exec()
  expect(exit.exit).toBeCalled()
})
