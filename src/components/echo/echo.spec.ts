import { Testing } from 'src/testing'
import { Group } from '../group/group'
import { Echo } from './echo'

let echo: Echo

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await echo.dispose()
})

test('pass string in echo', async () => {
  Testing.vars.name = 'world'
  echo = await Testing.newElement(Echo, 'Hello ${vars.name}')
  const rs = await echo.exec()
  expect(rs).toBe(`Hello ${Testing.vars.name}`)
})

test('pass object in echo', async () => {
  Testing.vars.name = 'world'
  echo = await Testing.newElement(Echo, {
    content: { txt: 'Hello ${vars.name}' }
  })
  const rs = await echo.exec()
  expect(rs).toEqual({
    txt: `Hello ${Testing.vars.name}`
  })
})

test('quick print text with color', async () => {
  const group = await Testing.newElement(Group, [
    {
      "echo'blue": 'blue here'
    },
    {
      "echo'red": 'red here'
    }
  ])
  const echo = await group.exec() as Echo[]
  expect(echo[0].style).toBe('blue')
  expect(echo[1].style).toBe('red')
})
