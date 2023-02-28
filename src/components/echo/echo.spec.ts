import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Echo } from './echo'

let echo: ElementProxy<Echo>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await echo.dispose()
})

test('pass string in echo', async () => {
  Testing.vars.name = 'world'
  echo = await Testing.createElementProxy(Echo, 'Hello ${$vars.name}')
  const rs = await echo.exec()
  expect(rs).toBe(`Hello ${Testing.vars.name}`)
})

test('pass object in echo', async () => {
  Testing.vars.name = 'world'
  echo = await Testing.createElementProxy(Echo, {
    content: { txt: 'Hello ${$vars.name}' }
  })
  const rs = await echo.exec()
  expect(rs).toEqual({
    txt: `Hello ${Testing.vars.name}`
  })
})
