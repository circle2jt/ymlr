import { PackagesManagerFactory } from 'src/managers/packages-manager-factory'
import { InstallAbstract } from './install.abstract'
import { type UninstallProps } from './uninstall.props'

/** |**  npm'uninstall
  Uninstall librarries to use in the scene.
  @example
  ```yaml
    - npm'uninstall: module1, module2

    - npm'uninstall:
        - module1
        - myapp

    - name: Uninstall librarry
      npm'uninstall: [ymlr-telegram, ymlr...]
  ```
*/
export class Uninstall extends InstallAbstract {
  constructor(props: UninstallProps) {
    super(props)
  }

  override async action(...packsInstall: string[]) {
    const packageManager = PackagesManagerFactory.GetInstance(this.logger)
    await packageManager.uninstall(...packsInstall)
  }
}
