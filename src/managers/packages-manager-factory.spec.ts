import { sleep } from 'src/libs/time'
import { Testing } from 'src/testing'
import { type PM } from './package-managers'
import { PackagesManagerFactory } from './packages-manager-factory'

let packageManager: PM

beforeAll(async () => {
  await Testing.reset()
  packageManager = PackagesManagerFactory.GetInstance(Testing.logger)
  jest.resetModules()
})

afterAll(async () => {
  await packageManager.clean()
})

test('Install a new modules', async () => {
  const moduleNames = ['lodash.isequal']
  try {
    await packageManager.install(...moduleNames)
    const rs = packageManager.getInstalledPackages(...moduleNames)
    expect(rs?.[0]).toBeTruthy()
    // expect(packageManager.dependencies[moduleNames[0]]).toBeDefined()
  } finally {
    await packageManager.uninstall(...moduleNames)
  }
})

test('Uninstall a new modules', async () => {
  const moduleNames = ['lodash.clone', 'lodash.clonedeep']
  try {
    await packageManager.install(...moduleNames)
    await sleep('1s')
    await packageManager.uninstall(moduleNames[0])
    await sleep('1s')
    const [unInstalledName, ...installedNames] = moduleNames
    const installedPackages = packageManager.getInstalledPackages(...installedNames)
    const notInstalledPackages = packageManager.getNotInstalledPackages(unInstalledName)
    expect(installedPackages).toEqual(installedNames)
    expect(notInstalledPackages).toEqual([unInstalledName])
    const dependencies = packageManager.dependencies
    expect(dependencies[moduleNames[0]]).toBeUndefined()
    expect(dependencies[moduleNames[1]]).toBeDefined()
  } finally {
    await packageManager.uninstall(...moduleNames)
  }
})
