import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { type Echo } from '../echo/echo'
import { type ElementProxy } from '../element-proxy'
import { Group } from './group'
import { type GroupItemProps, type GroupProps } from './group.props'

let group: ElementProxy<Group<GroupProps, GroupItemProps>> | undefined

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await group?.dispose()
})

test('if - condition', async () => {
  group = await Testing.createElementProxy(Group, {}, {
    runs: [
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
    ]
  })
  const [echo] = await group.exec() as Array<ElementProxy<Echo>>
  expect(echo.result).toBe(2)
  expect(Testing.vars.name).toBe('name 01')
})

test('elseif - condition', async () => {
  group = await Testing.createElementProxy(Group, [
    {
      vars: {
        i: 8
      }
    },
    {
      if: '${ $vars.i > 10 }',
      echo: '>10'
    },
    {
      elseif: '${ $vars.i > 6 }',
      echo: '>6'
    },
    {
      elseif: '${ $vars.i > 2 }',
      echo: '>2'
    },
    {
      if: '${ $vars.i < 8 }',
      echo: '<8'
    },
    {
      elseif: '${ $vars.i < 10 }',
      echo: '<10'
    },
    {
      echo: 'done'
    }
  ])
  const rs = await group.exec() as Array<ElementProxy<Echo>>
  expect(rs).toHaveLength(4)
  expect(rs[0].tag).toBe('base')
  expect(rs[1].result).toBe('>6')
  expect(rs[2].result).toBe('<10')
  expect(rs[3].result).toBe('done')
})

test('else - condition', async () => {
  group = await Testing.createElementProxy(Group, [
    {
      vars: {
        i: 3
      }
    },
    {
      if: '${ $vars.i > 10 }',
      echo: '>10'
    },
    {
      elseif: '${ $vars.i > 6 }',
      echo: '>6'
    },
    {
      else: null,
      echo: '>2'
    },
    {
      echo: 'done'
    }
  ])
  const rs = await group.exec() as Array<ElementProxy<Echo>>
  expect(rs).toHaveLength(3)
  expect(rs[0].tag).toBe('base')
  expect(rs[1].result).toBe('>2')
  expect(rs[2].result).toBe('done')
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
      js: 'return "OK"',
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
        js: 'return "OK"',
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
        js: 'return "OK"',
        vars: 'result'
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(0)
  expect(Testing.vars.result).toBeUndefined()
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

test('skipNext', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    runs: [
      {
        echo: 0
      },
      {
        echo: 1,
        skipNext: true
      },
      {
        echo: 2
      },
      {
        echo: 3
      }
    ]
  })
  await group.exec()
  expect(group.result).toHaveLength(2)
  expect(group.result[0].result).toBe(0)
  expect(group.result[1].result).toBe(1)
})

test('only', async () => {
  group = await Testing.createElementProxy(Group, undefined, {
    name: 'Test group',
    '~runs': [
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
  expect(group.name).toBe('Test group')
  expect(group.result[0].result).toBe(1)
  expect(group.result[1].result).toBe(3)
})

test('execute template', async () => {
  group = await Testing.createElementProxy(Group, {
    name: 'Test group',
    '~runs': [
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

test('should include a file to execute', async () => {
  const f = new FileTemp()
  try {
    f.create(`
- echo: 1
- echo: 2
`)
    group = await Testing.createElementProxy(Group, {
      name: 'Test group',
      runs: [
        {
          echo: 0
        },
        {
          include: f.file
        },
        {
          echo: 3
        }
      ]
    })
    await group.exec()
    expect(group.result).toHaveLength(4)
    expect(group.result[0].result).toBe(0)
    expect(group.result[1].result).toBe(1)
    expect(group.result[2].result).toBe(2)
    expect(group.result[3].result).toBe(3)
  } finally {
    f.remove()
  }
})

test('should detach a tag to run in background', async () => {
  const result = await Testing.reset(`
- name: background job
  detach: true
  runs:
    - loop: \${[1, 2, 3]}
      runs:
        - sleep: 500
    - echo: hehe
    - vars:
        done: \${Date.now()}
- name: task 1
- name: task 2
  echo: \${Date.now()}
- sleep: 2s
  `)
  expect(result[2].result).toBeLessThan(Testing.vars.done)
})
