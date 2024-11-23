import assert from 'assert'
import { execSync } from 'child_process'
import ENVGlobal from 'src/env-global'
import { type Logger } from 'src/libs/logger'
import { Bun } from './package-managers/bun'
import { Npm } from './package-managers/npm'
import { Pnpm } from './package-managers/pnpm'
import { Yarn } from './package-managers/yarn'

type NPMSupport = 'npm' | 'yarn' | 'pnpm' | 'bun'

export class PackagesManagerFactory {
  private static PackageManagerType?: NPMSupport

  static GetInstance(logger: Logger, type?: NPMSupport) {
    if (!this.PackageManagerType) {
      this.PackageManagerType = type

      if (!this.PackageManagerType) {
        this.PackageManagerType = ENVGlobal.PACKAGE_MANAGERS
          .split(',')
          .map((e) => e.trim() as NPMSupport)
          .find((bin: string) => {
            try {
              const log = execSync(`${bin} -v`).toString()
              if (log) {
                return bin
              }
            } catch { }
            return undefined
          })
      }

      assert(this.PackageManagerType, 'Could not found "npm" or "yarn" to install lack packages')
    }
    switch (this.PackageManagerType) {
      case 'bun':
        return new Bun(logger)
      case 'yarn':
        return new Yarn(logger)
      case 'pnpm':
        return new Pnpm(logger)
      default:
        return new Npm(logger)
    }
  }
}
