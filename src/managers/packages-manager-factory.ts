import assert from 'assert'
import { execSync } from 'child_process'
import { type Logger } from 'src/libs/logger'
import { Bun } from './package-managers/bun'
import { Npm } from './package-managers/npm'
import { Pnpm } from './package-managers/pnpm'
import { Yarn } from './package-managers/yarn'

type NPMSupport = 'npm' | 'yarn' | 'pnpm' | 'bun'
const PackageManagerSupported = (process.env.PACKAGE_MANAGERS?.split(',') || ['yarn', 'npm', 'pnpm', 'bun']) as NPMSupport[]

export class PackagesManagerFactory {
  private static PackageManagerType?: NPMSupport

  static GetInstance(logger: Logger, type?: NPMSupport) {
    if (!this.PackageManagerType) {
      this.PackageManagerType = type || PackageManagerSupported.find((bin: string) => {
        try {
          const log = execSync(`${bin} -v`).toString()
          if (log) {
            return bin
          }
        } catch { }
        return undefined
      })
      assert(this.PackageManagerType, 'Could not found "npm" or "yarn" to install lack packages')
    }
    switch (this.PackageManagerType) {
      case 'bun':
        return new WeakRef(new Bun(logger))
      case 'yarn':
        return new WeakRef(new Yarn(logger))
      case 'pnpm':
        return new WeakRef(new Pnpm(logger))
      default:
        return new WeakRef(new Npm(logger))
    }
  }
}
