import { Testing } from 'src/testing'
import { Echo } from '../echo/echo'
import { Group } from './group'
import { GroupItemProps, GroupProps } from './group.props'

let group: Group<GroupProps, GroupItemProps>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await group.dispose()
})

test('if - condition', async () => {
  group = await Testing.newElement(Group, [
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
  const [echo] = await group.exec() as Echo[]
  expect(echo.result).toBe(2)
  expect(Testing.vars.name).toBe('name 01')
})

test('loop', async () => {
  group = await Testing.newElement(Group, [
    {
      loop: '${[1,2,3]}',
      name: '${this.loopValue}'
    }
  ])
  const steps = await group.exec()
  expect(steps).toHaveLength(3)
})

test('pass a config into item in group', async () => {
  group = await Testing.newElement(Group, [
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
  group = await Testing.newElement(Group, {
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
  group = await Testing.newElement(Group, {
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
