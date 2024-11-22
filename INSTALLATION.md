# ymlr
A platform helps to run everythings base on a yaml script file

## Installation
Install via npm
```sh
  npm install -g ymlr
```

Install via yarn
```sh
  yarn global add ymlr
```

## Supported tags
1. [ymlr-mqtt](https://github.com/circle2jt/ymlr-mqtt) Pub/sub messages to channels in mqtt
2. [ymlr-redis](https://github.com/circle2jt/ymlr-redis) Handle redis into ymlr platform
3. [ymlr-telegram](https://github.com/circle2jt/ymlr-telegram) Send telegram text, photo..., support "listen", "command", "hears"... in telegram bot
4. [ymlr-sql](https://github.com/circle2jt/ymlr-sql) Execute query to mysql, postgresql, orable, sqlite...
5. [ymlr-cron](https://github.com/circle2jt/ymlr-cron) Schedule jobs to do something base on cron pattern

## Run a scene
Run a scene file
```sh
  ymlr $PATH_TO_SCENE_FILE
```

Run a encrypted scene file with a password
```sh
  ymlr $PATH_TO_SCENE_FILE $PASSWORD
```

Override env variables then run
```sh
  ymlr -e "port=80" -e "log=error" -- $PATH_TO_SCENE_FILE
```

## CLI

Show helps
```sh
  ymlr -h
```

Show all tags version
```sh
  ymlr
```

Add new external tags, libraries which is used in the scene
```sh
  ymlr add ymlr-telegram@latest
```

Upgrade external tags, libraries which is used in the scene
```sh
  ymlr up ymlr-telegram@latest
```

Remove external tags, libraries which is used in the scene
```sh
  ymlr rm ymlr-telegram@latest
```

Customize source paths which are registed tags in your application

```sh
  ymlr --tag-dirs /myapp1 --tag-dirs /myapp2 -- myapp.yaml     # "/myapp1", "/myapp2" are includes source code
```

Override show debug log for all of tags
```sh
  ymlr --debug=all -- myapp.yaml
```

## Docker

Docker image file: [circle2jt/ymlr](https://hub.docker.com/r/circle2jt/ymlr)

Run a scene file.  
Default is `/script/index.yaml`, you can override it in commands  
`$PASSWORD` is optional when run a encrypted scene file

```sh
  docker run -v $PATH_TO_SCENE_FILE:/scripts/index.yaml --rm -it circle2jt/ymlr /scripts/index.yaml $PASSWORD
```

Run a specific file
```sh
  docker run -v $PATH_TO_SCENE_DIR:/scripts --rm -it circle2jt/ymlr /scripts/$PATH_TO_SCENE_FILE
```

## Example

1. Create a scene file at `test.yaml`
```yaml
name: Test scene
runs:
  - echo: Hello world

  - name: Get post data
    http'get:
      url: http://localhost:3000/posts
    vars: postData

  - echo: ${ $vars.postData }
```

2. Run
```sh
  ymlr test.yaml
```

## Visual Studio Code extensions

- [ymlr-vscode](https://marketplace.visualstudio.com/items?itemName=circle2jt.ymlr-vscode) Play ymlr scenarios in vscode.   
After install the extension, please open a scenario file then press `shift+alt+r` to run the scenario.

- [Hightlight](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-highlight) variables, utils, constants... in yaml scenarios.

  Add the below configuration to your `settings.json`
  ```json
  {
    "highlight.regexes": {
        "^\\s*#(.+)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#333333"
                }
            ]
        },
        "[^#].*?(\\$v\\.)|(\\$vars\\.)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#98ffa0"
                },
                {
                    "color": "#98ffa0"
                }
            ]
        },
        "(\\$ps\\.)|(\\$parentState\\.)|(this\\.)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#55b85d"
                },
                {
                    "color": "#55b85d"
                }
            ]
        },
        "(\\$loopValue[\\. ])|(\\$lv[\\. ])|(\\.loopValue)|(\\$loopKey[\\. ])|(\\$lk[\\. ]|(\\.loopKey))": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#40723a"
                },
                {
                    "color": "#40723a"
                },
                {
                    "color": "#509549"
                },
                {
                    "color": "#509549"
                }
            ]
        },
        "(\\$u\\.)|(\\$utils\\.)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#70aeff"
                },
                {
                    "color": "#70aeff"
                }
            ]
        },
        "(\\$\\{[^}]+\\})": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#cf36bb"
                }
            ]
        }
    }
  }
  ```
