import { sleep } from '../time'

interface Task {
  key: string
  t: Promise<any>
  resolve: any
}
export class Sequence {
  private readonly tasks = new Array<Task>()
  private isRunning = false

  constructor(public readonly minTaskTimeout: string | number = 200) {

  }

  exec(task: Task) {
    this.tasks.push(task)

    if (this.isRunning) {
      return
    }
    this.isRunning = true
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setImmediate(async () => {
      let task: Task | undefined
      try {
        while ((task = this.tasks.shift())) {
          task.resolve()
          await sleep(this.minTaskTimeout)
        }
      } finally {
        this.isRunning = false
      }
    })
  }

  async wait(key: any) {
    let task: any = this.tasks.find(task => task.key === key)
    if (task) {
      await task.t
      return
    }
    task = {
      key
    }
    task.t = new Promise((resolve) => {
      task.resolve = resolve
    })
    this.exec(task)
    await task.t
  }
}
