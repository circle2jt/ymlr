import { Testing } from 'src/testing'
import { PackagesManager } from './packages-manager'

let packageManager: PackagesManager

beforeEach(async () => {
  await Testing.reset()
  jest.resetModules()
})

beforeAll(() => {
  packageManager = new PackagesManager(Testing.rootScene)
})

afterAll(async () => {
  await packageManager.clean()
})

test('Install a new modules', async () => {
  const moduleNames = ['lodash.merge']
  try {
    await packageManager.install(...moduleNames)
    const rs = packageManager.getInstalledPackages(...moduleNames)
    expect(rs[0]).toBeTruthy()
    const dependencies = PackagesManager.Dependencies
    expect(dependencies[moduleNames[0]]).toBeDefined()
  } finally {
    await packageManager.uninstall(...moduleNames)
  }
})

test('Uninstall a new modules', async () => {
  const moduleNames = ['lodash.clone', 'lodash.clonedeep']
  try {
    await packageManager.install(...moduleNames)
    await packageManager.uninstall(moduleNames[0])
    const [unInstalledName, ...installedNames] = moduleNames
    const installedPackages = packageManager.getInstalledPackages(...installedNames)
    const notInstalledPackages = packageManager.getNotInstalledPackages(unInstalledName)
    expect(installedPackages).toEqual(installedNames)
    expect(notInstalledPackages).toEqual([unInstalledName])
    const dependencies = PackagesManager.Dependencies
    expect(dependencies[moduleNames[0]]).toBeUndefined()
    expect(dependencies[moduleNames[1]]).toBeDefined()
  } finally {
    await packageManager.uninstall(...moduleNames)
  }
})
