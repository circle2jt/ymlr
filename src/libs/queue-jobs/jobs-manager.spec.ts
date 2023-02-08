import { Testing } from 'src/testing'
import { sleep } from '../time'
import { Job } from './job'
import { JobsManager } from './jobs-manager'

class MyJob implements Job {
  constructor(public name: string, private readonly time: number) { }

  async jobExecute() {
    Testing.logger.info('Exec ' + this.name)
    await sleep(this.time)
  }
}

class MyFailedJob implements Job {
  constructor(public name: string, private readonly time: number) { }

  async jobExecute() {
    Testing.logger.info('Exec ' + this.name)
    await sleep(this.time)
    throw new Error(this.name + ' is failed')
  }
}

test('Test jobs run successfully', async () => {
  let countRunningJob = 0
  let countDoneJob = 0
  let countSuccessJob = 0
  const jm = new JobsManager(Testing.logger, {
    concurrent: 2,
    jobHandler: {
      onJobSuccess() {
        countSuccessJob++
      },
      onJobRun() {
        countRunningJob++
      },
      onJobDone() {
        countDoneJob++
        countRunningJob--
      }
    }
  })
  await jm.add(new MyJob('job 1', 500))
  await jm.add(new MyJob('job 2', 1000))
  await jm.add(new MyJob('job 3', 2000))
  await jm.add(new MyJob('job 4', 2000))
  setTimeout(() => jm.stop(), 1000)
  await jm.start()
  expect(countRunningJob).toBe(0)
  expect(countDoneJob).toBe(3)
  expect(countSuccessJob).toBe(3)
})

test('Test jobs run failed', async () => {
  let countRunningJob = 0
  let countDoneJob = 0
  let countSuccessJob = 0
  let failName = ''
  const jm = new JobsManager(Testing.logger, {
    concurrent: 2,
    jobHandler: {
      onJobFailure(_error, job: Job) {
        failName = (job as MyFailedJob).name
        return true // Try again
      },
      onJobSuccess() {
        countSuccessJob++
      },
      onJobRun() {
        countRunningJob++
      },
      onJobDone() {
        countDoneJob++
        countRunningJob--
      }
    }
  })
  await jm.add(new MyJob('job 1', 500))
  await jm.add(new MyFailedJob('job 2', 1000))
  await jm.add(new MyJob('job 3', 2000))
  await jm.add(new MyJob('job 4', 2000))
  setTimeout(() => jm.stop(), 1000)
  await jm.start()
  expect(countRunningJob).toBe(0)
  expect(countDoneJob).toBe(3)
  expect(countSuccessJob).toBe(2)
  expect(failName).toBe('job 2')
})

test('Test jobs run failed then stop', async () => {
  const jm = new JobsManager(Testing.logger, {
    concurrent: 2,
    jobHandler: {
      onJobFailure() {
        throw new Error('Stop here')
      }
    }
  })
  await jm.add(new MyJob('job 1', 500))
  await jm.add(new MyFailedJob('job 2', 1000))
  await jm.add(new MyJob('job 3', 2000))
  await jm.add(new MyJob('job 4', 2000))
  setTimeout(() => jm.stop(), 1000)
  try {
    await jm.start()
  } catch (err) {
    expect(err).toBeDefined()
  }
})
