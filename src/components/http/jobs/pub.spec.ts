import { ElementProxy } from 'src/components/element-proxy'
import { Testing } from 'src/testing'
import { Pub } from './pub'
import { Sub } from './sub'

let sub: ElementProxy<Sub>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await sub.dispose()
})

test('Add a jobs in queue', async () => {
  const jobData = { foo: 'bar' }

  sub = await Testing.createElementProxy(Sub, {
    address: '0.0.0.0:4000',
    runs: [
      {
        vars: {
          jobData: '${parentState.jobData}'
        }
      },
      {
        "http/jobs'stop": null
      }
    ]
  })
  const t = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      const pub = await Testing.createElementProxy(Pub, {
        address: '0.0.0.0:4000',
        data: jobData
      })
      try {
        await pub.exec()
      } catch (err) {
        reject(err)
      } finally {
        await pub.dispose()
      }
      resolve(undefined)
    }, 1000)
  })
  await sub.exec()
  await t
  expect(Testing.vars.jobData).toEqual(jobData)
})
