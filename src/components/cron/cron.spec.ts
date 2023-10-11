import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { type ElementProxy } from '../element-proxy'
import { Cron } from './cron'

let cron: ElementProxy<Cron>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await cron.dispose()
})

test('Test simple cron each 1 sec', async () => {
  Testing.vars.ok = false
  cron = await Testing.createElementProxy(Cron, {
    time: '* * * * * *',
    scheduled: true,
    runs: [
      {
        vars: {
          ok: true,
          lastDate: '${ $parentState.lastDate }'
        }
      }, {
        stop: null
      }
    ]
  })
  await Promise.race<any>([
    cron.exec(),
    sleep('2s')
  ])
  expect(Testing.vars.ok).toBe(true)
  expect(Testing.vars.lastDate).toBeInstanceOf(Date)
})
