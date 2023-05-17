import { FileTemp } from 'src/libs/file-temp'
import { Testing } from 'src/testing'
import { Include } from './include'

beforeEach(async () => {
  await Testing.reset()
})

test('should be includes a file', async () => {
  const f = new FileTemp()
  try {
    f.create(`
- echo: 1
- clear:
`)
    const include = await Testing.createElementProxy(Include, f.file)
    await include.exec()
    expect(include.result).toHaveLength(2)
    expect(Object.keys(include.result[0])[0]).toBe('echo')
    expect(Object.keys(include.result[1])[0]).toBe('clear')
  } finally {
    f.remove()
  }
})
