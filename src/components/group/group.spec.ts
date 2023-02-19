import { Testing } from 'src/testing'
import { Echo } from '../echo/echo'
import { ElementProxy } from '../element-proxy'
import { Group } from './group'
import { GroupItemProps, GroupProps } from './group.props'

let group: ElementProxy<Group<GroupProps, GroupItemProps>>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await group.dispose()
})

test('if - condition', async () => {
  group = await Testing.createElementProxy(Group, [
    {
      loop: '${[1,2,3]}',
      if: '${this.loopValue %2 === 0}',
      echo: '${this.loopValue}'
    },
    {
      vars: {
        name: 'name 01'
      }
    }
  ])
  const [echo] = await group.exec() as Array<ElementProxy<Echo>>
  expect(echo.result).toBe(2)
  expect(Testing.vars.name).toBe('name 01')
})

test('loop', async () => {
  group = await Testing.createElementProxy(Group, [
    {
      loop: '${[1,2,3]}',
      name: '${this.loopValue}'
    }
  ])
  const steps = await group.exec()
  expect(steps).toHaveLength(3)
})

test('pass a config into item in group', async () => {
  group = await Testing.createElementProxy(Group, [
    {
      "exec'js": 'return "OK"',
      vars: 'result'
    }
  ])
  await group.exec()
  expect(group.result).toHaveLength(1)
  expect(Testing.vars.result).toBe('OK')
})

test('pass full group information', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        "exec'js": 'return "OK"',
        vars: 'result'
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(1)
  expect(Testing.vars.result).toBe('OK')
})

test('run with false condition', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        if: '${false}',
        "exec'js": 'return "OK"',
        vars: 'result'
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(0)
  expect(Testing.vars.result).toBeUndefined()
})
