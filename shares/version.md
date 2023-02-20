# Auto commit and increase version in npm

## Prerequisites

- Installed `ymlr` package

## How to used

1. Create a scene file `./scripts/update_version.yaml` to update version
```yaml
  title: Update the version
  vars:
    preid: alpha                  # [alpha | beta | rc | latest]
    versionName: prerelease       # [major | minor | patch | premajor | preminor | prepatch | prerelease]
  runs:
  - scene:
      path: https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/version.yaml
      vars:
        preid: ${$vars.preid}
        versionName: ${$vars.versionName}
        changeDir: ../changelogs      # Path of folder which includes log files for each of changing
        changeFile: ../CHANGELOG.md   # Path of CHANGELOG file
        commitFiles:                  # Files will be added to commit when up version
          - ~~/README.md
          - ~~/package.json
```

2. Run the scene file to up version
```sh
  ymlr ./scripts/update_version.yaml

  # OR override preid and version name

  ymlr -e preid=latest -e VERSIONNAME=patch -- ./scripts/update_version.yaml
```

3. After done, files will be generated to `changeDir` and `changeFile`.

- `changeDir`: Path of folder which includes log files for each of changing
- `changeFile`: Path of CHANGELOG file