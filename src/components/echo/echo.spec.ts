import { Testing } from 'src/testing'
import { ElementProxy } from '../element-proxy'
import { Group } from '../group/group'
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
  echo = await Testing.createElementProxy(Echo, 'Hello ${vars.name}')
  const rs = await echo.exec()
  expect(rs).toBe(`Hello ${Testing.vars.name}`)
})

test('pass object in echo', async () => {
  Testing.vars.name = 'world'
  echo = await Testing.createElementProxy(Echo, {
    content: { txt: 'Hello ${vars.name}' }
  })
  const rs = await echo.exec()
  expect(rs).toEqual({
    txt: `Hello ${Testing.vars.name}`
  })
})

test('quick print text with color', async () => {
  const group = await Testing.createElementProxy(Group, [
    {
      "echo'blue": 'blue here'
    },
    {
      "echo'red": 'red here'
    }
  ])
  const echo = await group.exec() as Array<ElementProxy<Echo>>
  expect(echo[0].element.style).toBe('blue')
  expect(echo[1].element.style).toBe('red')
})
