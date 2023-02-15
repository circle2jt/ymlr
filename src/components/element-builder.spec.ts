import { Testing } from 'src/testing'
import { Group } from './group/group'

beforeEach(async () => {
  await Testing.reset()
  jest.resetModules()
})

test('element.force', async () => {
  const group = await Testing.newElement(Group, [{
    force: true,
    echo: '${abc}'
  }])
  const [echo] = await group.exec()
  expect(echo.error.message).toBeDefined()
})

test('element reference', async () => {
  const group = await Testing.newElement(Group, [{
    echo: 'Echo 1',
    vars: {
      echo1: '${this}'
    }
  }])
  const [echo] = await group.exec()
  const echo1 = Testing.vars.echo1
  expect(echo).toBe(echo1)
})

test('get parent in loop', async () => {
  const group = await Testing.newElement(Group, [
    {
      loop: '${[1,2]}',
      group: {
        runs: [
          {
            echo: '${this.parent.loopValue}'
          }
        ]
      }
    }
  ])
  const steps = await group.exec()
  expect(steps).toHaveLength(2)
  expect(steps[0].result[0].result).toBe(1)
  expect(steps[1].result[0].result).toBe(2)
})
