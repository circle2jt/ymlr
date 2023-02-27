import { existsSync, unlinkSync } from 'fs'
import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { Echo } from '../echo/echo'
import { Scene } from '../scene/scene'

let encryptedFile: string | undefined
const password = 'example'

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
})

afterAll(() => {
  encryptedFile && unlinkSync(encryptedFile)
})

test('should import and execute successfully', async () => {
  const tmp = new FileTemp()
  const scene = await Testing.createElementProxy(Scene, {
    content: `
runs: [
  {
    import: ${tmp.file}
  }
]
`
  })
  try {
    tmp.create(`
- echo: hello there
`)
    const [echo] = await scene.exec()
    expect(echo?.$).toBeInstanceOf(Echo)
    expect(echo.result).toBe('hello there')
  } finally {
    tmp.remove()
    scene.dispose()
  }
})

test('should import and execute a encrypted scene successfully', async () => {
  const tmp = new FileTemp()
  const sceneEncrypted = await Testing.createElementProxy<Scene>(Scene, { path: tmp.file })
  try {
    tmp.create(`
password: ${password}
runs:
  - echo: hello there
  `)
    await sceneEncrypted.exec()
    expect(sceneEncrypted.element.encryptedPath && existsSync(sceneEncrypted.element.encryptedPath)).toBe(true)
    encryptedFile = sceneEncrypted.element.encryptedPath

    const scene = await Testing.createElementProxy(Scene, {
      content: `
- import:
    path: ${sceneEncrypted.element.encryptedPath}
    password: ${password}
  `
    })
    try {
      const [group] = await scene.exec()
      const [echo] = group.result
      expect(echo?.$).toBeInstanceOf(Echo)
      expect(echo.result).toBe('hello there')
    } finally {
      scene.dispose()
    }
  } finally {
    tmp.remove()
    await sceneEncrypted.dispose()
  }
})
