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

## Run a scene
Run a scene file
```sh
  r $PATH_TO_SCENE_FILE
```

Run a encrypted scene file with a password
```sh
  r $PATH_TO_SCENE_FILE $PASSWORD
```

Override env variables then run
```sh
  r -e "port=80" -e "log=error" -- $PATH_TO_SCENE_FILE
```

## CLI

Show helps
```sh
  r -h
```

Add new external tags, libraries which is used in the scene
```sh
  r add ymlr-telegram@latest
```

Upgrade external tags, libraries which is used in the scene
```sh
  r up ymlr-telegram@latest
```

Remove external tags, libraries which is used in the scene
```sh
  r rm ymlr-telegram@latest
```

Customize source paths which are registed tags in application

```sh
  r --tag-dirs /myapp1 --tag-dirs /myapp2 -- myapp.yaml     # "/myapp1", "/myapp2" are includes source code
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
  r test.yaml
```

