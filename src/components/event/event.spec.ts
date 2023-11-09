import { Testing } from 'src/testing'
import { EventEmiter } from './emit'
import { EventOn } from './on'

beforeEach(async () => {
  await Testing.reset()
})

test('emit/on data via global event', async () => {
  const on = await Testing.createElementProxy(EventOn, {
    name: 'test-event'
  }, {
    runs: [
      {
        vars: {
          myEventData: '${ $parentState.eventData }'
        }
      }, {
        stop: null
      }
    ]
  })
  const emiter = await Testing.createElementProxy(EventEmiter, {
    name: 'test-event',
    data: {
      name: 'test-data',
      say: 'hello'
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    await emiter.exec()
    await emiter.dispose()
  }, 1000)
  await on.exec()
  await on.dispose()
  expect(Testing.vars.myEventData).toEqual({
    name: 'test-data',
    say: 'hello'
  })
})
