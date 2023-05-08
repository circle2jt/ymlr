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
      if: '${$loopValue %2 === 0}',
      echo: '${$loopValue}'
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
      name: '${$loopValue}'
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

test('test preScript and postScript', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        preScript: '$vars.vl = "0"',
        "exec'js": '$vars.vl += "1"',
        postScript: '$vars.vl += "2"'
      }
    ]
  })
  await group.exec()
  expect(Testing.vars.vl).toBe('012')
})

test('skip', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        echo: 0
      },
      {
        skip: true,
        echo: 1
      },
      {
        echo: 2
      },
      {
        skip: true,
        echo: 3
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(2)
  expect(group.result[0].result).toBe(0)
  expect(group.result[1].result).toBe(2)
})

test('only', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        echo: 0
      },
      {
        only: true,
        echo: 1
      },
      {
        echo: 2
      },
      {
        only: true,
        echo: 3
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(2)
  expect(group.result[0].result).toBe(1)
  expect(group.result[1].result).toBe(3)
})

test('execute template', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        '->': 'echo0',
        template: true,
        echo: 0
      },
      {
        '<-': 'echo0'
      },
      {
        '<-': 'echo0',
        echo: 1
      },
      {
        '<-': 'echo0',
        echo: {
          content: 2
        }
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(3)
  expect(group.result[0].result).toBe(0)
  expect(group.result[1].result).toBe(1)
  expect(group.result[2].result).toBe(2)
})
