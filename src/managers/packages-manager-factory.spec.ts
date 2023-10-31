import { Testing } from 'src/testing'
import { type PM } from './package-managers'
import { PackagesManagerFactory } from './packages-manager-factory'

let packageManager: WeakRef<PM>

beforeAll(async () => {
  await Testing.reset()
  packageManager = PackagesManagerFactory.GetInstance(Testing.logger)
  jest.resetModules()
})

afterAll(async () => {
  await packageManager.deref()?.clean()
})

test('Install a new modules', async () => {
  const moduleNames = ['lodash.merge']
  try {
    await packageManager.deref()?.install(...moduleNames)
    const dependencies = packageManager.deref()?.dependencies
    const rs = packageManager.deref()?.getInstalledPackages(...moduleNames)
    expect(rs?.[0]).toBeTruthy()
    expect(dependencies[moduleNames[0]]).toBeDefined()
  } finally {
    await packageManager.deref()?.uninstall(...moduleNames)
  }
})

test('Uninstall a new modules', async () => {
  const moduleNames = ['lodash.clone', 'lodash.clonedeep']
  try {
    await packageManager.deref()?.install(...moduleNames)
    await packageManager.deref()?.uninstall(moduleNames[0])
    const [unInstalledName, ...installedNames] = moduleNames
    const installedPackages = packageManager.deref()?.getInstalledPackages(...installedNames)
    const notInstalledPackages = packageManager.deref()?.getNotInstalledPackages(unInstalledName)
    expect(installedPackages).toEqual(installedNames)
    expect(notInstalledPackages).toEqual([unInstalledName])
    const dependencies = packageManager.deref()?.dependencies
    expect(dependencies[moduleNames[0]]).toBeUndefined()
    expect(dependencies[moduleNames[1]]).toBeDefined()
  } finally {
    await packageManager.deref()?.uninstall(...moduleNames)
  }
})
