import { Testing } from 'src/testing'
import { Group } from './group/group'

beforeEach(async () => {
  await Testing.reset()
  jest.resetModules()
})

test('element.force', async () => {
  const group = await Testing.newElement(Group, [{
    echo: {
      force: true,
      content: '${abc}'
    }
  }])
  const [echo] = await group.exec()
  expect(echo.error.message).toBeDefined()
})

test('element reference', async () => {
  const group = await Testing.newElement(Group, [{
    echo: {
      content: 'Echo 1',
      vars: {
        echo1: '${this}'
      }
    }
  }])
  const [echo] = await group.exec()
  const echo1 = Testing.vars.echo1
  expect(echo).toBe(echo1)
})

test('get parent in loop', async () => {
  const group = await Testing.newElement(Group, [
    {
      group: {
        loop: '${[1,2]}',
        runs: [
          {
            echo: {
              content: '${this.parent.loopValue}'
            }
          }
        ]
      }
    }
  ])
  const rs = await group.exec()
  expect(rs).toHaveLength(2)
  expect(rs[0].result[0].result).toBe(1)
  expect(rs[1].result[0].result).toBe(2)
})
