# Auto commit and increase version in npm

## How to used

Manual update version
```sh
  ymlr https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/version.yaml
```

Prerelease 
_0.0.1-alpha.1 -> 0.0.1-alpha.2_
_0.0.1-alpha.2 -> 0.0.1-alpha.3_

```sh
  ymlr \
    -e "force=true" \
    -e "preid=alpha" \
    -e "versionName=prerelease" \
    https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/version.yaml
```

Patch 
_0.0.1-alpha.1 -> 0.0.1_
_0.0.1 -> 0.0.2_

```sh
  ymlr \
    -e "force=true" \
    -e "versionName=patch" \
    https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/version.yaml
```
