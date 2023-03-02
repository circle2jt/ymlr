# Upload a files to (https://tmpfiles.org) share to others

## Prerequisites

- Installed `ymlr` package

# Run in local
```sh
  ymlr -e file=/files -- https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/upload-files/upload-files example
```

## Run in docker container
```yaml
  docker run -v $LOCAL_FILE_TO_UPLOAD:/files --rm -t circle2jt/ymlr -e file=/files -- https://raw.githubusercontent.com/circle2jt/ymlr/main/shares/upload-files/upload-files example
```
