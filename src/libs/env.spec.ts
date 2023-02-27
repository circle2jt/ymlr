import { FileTemp } from 'src/libs/file-temp'
import { Env } from './env'
import { Logger, LoggerLevel } from './logger'

const logger = new Logger(LoggerLevel.SILENT)

test('Should load env from files and objects', async () => {
  const tmpFile = new FileTemp('.env')
  try {
    tmpFile.create(`
NAME=env 1
age=11
MALE=true
ADMIN=0
user1_NAME=thanh update
user1_age=36
USER1_MALE=false
`)

    const env = new Env(logger)
    const vars = await env.loadEnvToBase({
      name: 'string',
      age: 123,
      male: false,
      ADMIN: false,
      user1: {
        name: 'thanh',
        age: 30,
        male: true
      }
    }, {
      name: 'thanh',
      age: 123,
      male: false,
      ADMIN: true
    }, tmpFile.file)

    expect(vars).toEqual({
      name: 'env 1',
      age: 11,
      male: true,
      ADMIN: false,
      user1: {
        name: 'thanh update',
        age: 36,
        male: false
      }
    })
  } finally {
    tmpFile.remove()
  }
})
