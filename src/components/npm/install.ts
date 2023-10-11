import { PackagesManagerFactory } from 'src/managers/packages-manager-factory'
import { InstallAbstract } from './install.abstract'
import { type InstallProps } from './install.props'

/** |**  npm'install
  Install librarries to use in the scene.
  @example
  ```yaml
    - npm'install: module1, module2

    - npm'install:
        - module1
        - myapp: git+ssh:git@github.com:...

    - Always get latest ymlr-telegram librarry
      npm'install: [lodash, ymlr-telegram@latest]

    # How to used
    - exec'js: |
        vars.newObject = require('lodash').merge({a: 2, b: 2}, {a: 1})
        require('myapp')

    - echo: ${$vars.newObject}
  ```

  Install from github
  ```yaml
    - name: Install from github
      if: ${$vars.useExternalPackage}
      npm'install:
        - myapp: git+ssh:git@github.com:...
        - ymlr...

    # How to used
    - myapp:
        name: This is my first application

  ```

*/
export class Install extends InstallAbstract {
  constructor(props: InstallProps) {
    super(props)
  }

  override async action(...packsInstall: string[]) {
    const packageManager = PackagesManagerFactory.GetInstance(this.logger)
    await packageManager.install(...packsInstall)
  }
}
