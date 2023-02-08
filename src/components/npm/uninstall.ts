import { PackagesManager } from 'src/managers/packages-manager'
import { InstallAbstract } from './install.abstract'
import { UninstallProps } from './uninstall.props'

/** |**  npm'uninstall
  Uninstall librarries to use in the scene.
  @example
  ```yaml
    - npm'uninstall: module1, module2

    - npm'uninstall:
        - module1
        - myapp

    - npm'uninstall:
        title: Uninstall librarry
        packages:
          - ymlr-telegram
          - ymlr...
  ```
*/
export class Uninstall extends InstallAbstract {
  constructor(props: UninstallProps) {
    super(props)
  }

  async action(...packsInstall: string[]) {
    const packageManager = new PackagesManager(this.scene)
    await packageManager.uninstall(...packsInstall)
  }
}
