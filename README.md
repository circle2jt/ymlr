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
        "(\\$v\\.)|(\\$vars\\.)": {
            "regexFlags": "gm",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#98ffa0",
                    "fontWeight": "bold"
                },
                {
                    "color": "#98ffa0",
                    "fontWeight": "bold"
                }
            ]
        },
        "(\\$ps\\.)|(\\$parentState\\.)|(this\\.)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#55b85d",
                    "fontWeight": "bold"
                },
                {
                    "color": "#55b85d",
                    "fontWeight": "bold"
                }
            ]
        },
        "(\\$loopValue[\\. ])|(\\$lv[\\. ])|(\\.loopValue)|(\\$loopKey[\\. ])|(\\$lk[\\. ]|(\\.loopKey))": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#40723a",
                    "fontWeight": "bold"
                },
                {
                    "color": "#40723a",
                    "fontWeight": "bold"
                },
                {
                    "color": "#509549",
                    "fontWeight": "bold"
                },
                {
                    "color": "#509549",
                    "fontWeight": "bold"
                }
            ]
        },
        "(\\$u\\.)|(\\$utils\\.)": {
            "regexFlags": "g",
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#70aeff",
                    "fontWeight": "bold"
                },
                {
                    "color": "#70aeff",
                    "fontWeight": "bold"
                }
            ]
        },
        "(\\$\\{[^}]+\\})": { // A regex will be created from this string, don't forget to double escape it
            "regexFlags": "g", // Flags used when building this regex
            "filterLanguageRegex": "yaml",
            "filterFileRegex": ".*\\.yaml",
            "decorations": [
                {
                    "color": "#6267f8",
                    "fontStyle": "italic"
                }
            ]
        }
    }
  }
  ```

<br/>

# Common tags which is used in the program

| Tags | Description |
|---|---|
| [md'doc](#md'doc) | Generate comment in a file to document |
| [echo](#echo) | Print to console screen |
| [echo'debug](#echo'debug) | Add more information when print to console screen |
| [clear](#clear) | Clear console screen |
| [event'emit](#event'emit) | Send data via global event |
| [event'on](#event'on) | Handle global events in app |
| [fn-debounce](#fn-debounce) | Debounce function (#Ref: lodash.debounce) |
| [fn-debounce'cancel](#fn-debounce'cancel) | Cancel debounce function (#Ref: lodash.debounce) |
| [fn-debounce'del](#fn-debounce'del) | Cancel & remove debounce function (#Ref: lodash.debounce) |
| [fn-debounce'flush](#fn-debounce'flush) | Force to call debounce function ASAP if it's called before that (#Ref: lodash.debounce) |
| [fn-debounce'touch](#fn-debounce'touch) | touch debounce function. Reused last agruments(#Ref: lodash.debounce) |
| [fn-queue](#fn-queue) | Register a queue job |
| [fn-queue'add](#fn-queue'add) | Add a job to an exsited queue |
| [fn-queue'del](#fn-queue'del) | Stop and remove a queue |
| [fn-singleton](#fn-singleton) | This is locked before run and unlock after done. When it's called many time, this is only run after unlock |
| [fn-singleton'del](#fn-singleton'del) | Remove singleton function |
| [fn-throttle](#fn-throttle) | Throttle function (#Ref: lodash.throttle) |
| [fn-throttle'cancel](#fn-throttle'cancel) | Cancel throttle function (#Ref: lodash.throttle) |
| [fn-throttle'del](#fn-throttle'del) | Cancel & remove throttle function (#Ref: lodash.throttle) |
| [fn-throttle'flush](#fn-throttle'flush) | Force to call throttle function ASAP if it's called before that (#Ref: lodash.throttle) |
| [fn-throttle'touch](#fn-throttle'touch) | touch throttle function. Reused last agruments (#Ref: lodash.throttle) |
| [exit](#exit) | Stop then quit the program |
| [fetch'del](#fetch'del) | Send a http request with DELETE method |
| [fetch'get](#fetch'get) | Send a http request with GET method |
| [fetch'head](#fetch'head) | Send a http request with HEAD method |
| [fetch'patch](#fetch'patch) | Send a http request with PATCH method |
| [fetch'post](#fetch'post) | Send a http request with POST method |
| [fetch'put](#fetch'put) | Send a http request with PUT method |
| [file'read](#file'read) | Read a file then load data into a variable |
| [file'store](#file'store) | Store data to file |
| [file'write](#file'write) | Write data to file |
| [http'del](#http'del) | Send a http request with DELETE method |
| [http'get](#http'get) | Send a http request with GET method |
| [http'head](#http'head) | Send a http request with HEAD method |
| [http'patch](#http'patch) | Send a http request with PATCH method |
| [http'post](#http'post) | Send a http request with POST method |
| [http'put](#http'put) | Send a http request with PUT method |
| [http'server](#http'server) | Create a http server to serve content via http |
| [include](#include) | Include a scene file or list scene files in a folder |
| [input'confirm](#input'confirm) | Get user confirm (yes/no) |
| [input'multiselect](#input'multiselect) | Suggest a list of choices for user then allow pick multiple choices |
| [input'number](#input'number) | Get user input from keyboard then convert to number |
| [input'password](#input'password) | Get user input from keyboard but hide them then convert to text |
| [input'select](#input'select) | Suggest a list of choices for user then allow pick a choice |
| [input'suggest](#input'suggest) | Suggest a list of choices for user then allow pick a choice or create a new one |
| [input'text](#input'text) | Get user input from keyboard then convert to text |
| [js](#js) | Execute a nodejs code |
| [npm'install](#npm'install) | Install librarries to use in the scene. |
| [npm'uninstall](#npm'uninstall) | Uninstall librarries to use in the scene. |
| [pause](#pause) | Pause the program then wait to user enter to continue |
| [runs](#runs) | Group elements |
| [scene](#scene) | Load another scene into the running program |
| [scene'returns](#scene'returns) | Return value to parent scene |
| [scene'thread](#scene'thread) | Same "scene" but it run in a new thread |
| [sh](#sh) | Execute a bash script or shell file |
| [sleep](#sleep) | Sleep the program then wait to user enter to continue |
| [tag'register](#tag'register) | Register custom tags from code or npm module, github.... |
| [test](#test) | Check conditions in the program |
| [view'flow](#view'flow) | View flows in a scene |
| [ymlr'load](#ymlr'load) | Merge, replace env variable in yaml files to a yaml file |


## <a id="Root scene"></a>Root scene  
`It's a scene file`  
Root scene file includes all of steps to run  

Example:  

```yaml
  name: Scene name                  # Scene name
  description: Scene description    # Scene description
  debug: info                       # Show log when run. Default is info. [silent, error, warn, info, debug, trace, all]
  password:                         # Encrypted this file with the password. To run this file, need to provides a password in the command line
  vars:                             # Declare global variables which are used in the program.
    env: production                 # |- Only the variables which are declared in the top of root scene just can be overrided by environment variables
  env:                              # Set value to environment variable (process.env)
    DEBUG: all
    NODE_ENV: production
    env: dev                        # It overrides to $vars.env
    # - NODE_ENV=production
  envFiles:                         # Load env variable from files (string | string[])
    - .env
    - .env.dev
  varsFiles:                        # Load vars from json or yaml files (string | string[])
    - ./var1.json
    - ./var2.yaml
  runs:                             # Defined all of steps which will be run in the scene
    - echo: Hello world
    - test: test props
```  


## <a id="->"></a>->  
`It's a property in a tag`  
Expose item properties for others extends  

Example:  

Use `skip`
```yaml
  - ->: helloTemplate
    skip: true
    echo: Hello               # Not run

  - <-: helloTemplate         # => Hello

```

Use `template`
```yaml
  - ->: hiTemplate
    template: Hi              # Not run

  - <-: hiTemplate            # => Hi
    echo:
```  


## <a id="# @include"></a># @include  
`It's a yaml comment type`  
Include the content file to current position.
This is will be read a file then copy file content into current position
If you want to use expresion ${}, you can use tag "include".
Useful for import var file ....  

Example:  

```yaml
  - vars:
      # @include ./.env
```

`.env` file is
```text
ENV: production
APP: test
```  


## <a id="<-"></a><-  
`It's a property in a tag`  
Copy properties from others (a item, or list items)  

Example:  

```yaml
  - ->: baseRequest
    template:
      baseURL: http://localhost
  - <-: baseRequest
    ->: user1Request
    template:
      headers:
        authorization: Bearer user1_token
  - ->: user2RequestWithoutBaseURL
    template:
      headers:
        authorization: Bearer user2_token

  - <-: user1Request
    http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user1_token"
      url: /posts
    vars: user1Posts

  - <-: [baseRequest, user2RequestWithoutBaseURL]
    http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user2_token"
      url: /posts
    vars: user2Posts
```  


## <a id="async"></a>async  
`It's a property in a tag`  
Execute parallel tasks  

Example:  

```yaml
  - async: true
    http'get:
      url: /categories
    vars: categories
  - ~http'get:            # Can use shortcut by add "~"" before tag name
      url: /product/1
    vars: product

  - name: The product ${$vars.product.name} is in the categories ${$vars.categories.map(c => c.name)}
```  


## <a id="context"></a>context  
`It's a property in a tag`  
Context logger name which is allow filter log by cli "ymlr --debug-context context_name=level --"  

Example:  

```yaml
  - name: Get list user
    context: userapi
    debug: warn
    http'get: ...

  - name: Get user details
    context: userapi
    debug: warn
    http'get: ...

  - name: Get product details
    context: productapi
    debug: warn
    http'get: ...
```
Now, we have 2 choices to debug all of user APIs and product APIs
1. Replace all "debug: warn" to "debug: debug"
2. Only run cli as below
```sh
  ymlr --debug-context userapi=debug --debug-context productapi=trace -- $SCENE_FILE.yaml
```  


## <a id="debug"></a>debug  
`It's a property in a tag`  
How to print log details for each of item.
Default is `info`
Value must be in:
- `true`: is `debug`
- `all`: Same `trace`
- `trace`: Print all of messages
- `debug`: Print of `debug`, `info`, `warn`, `error`, `fatal` messages
- `info`: Print `info`, `warn`, `error`, `fatal` messages
- `warn`: Print `warn`, `error`, `fatal` messages
- `error`: Print `error`, `fatal` messages
- `fatal`: Print `fatal` messages
- `secret`: Only show secret log. Example config, password, keys...
- `silent`: Not print anything  

Example:  

```yaml
  - name: Get data from a API
    debug: debug
    http'get:
      url: http://...../data.json
```  


## <a id="detach"></a>detach  
`It's a property in a tag`  
Push the tag execution to background jobs to run async, the next steps will be run ASAP. Before the program is exited, it will be released  

Example:  

```yaml
  - name: job1
    detach: true
    loop: ${[1,2,3]}
    runs:
      - echo: Hello ${this.parentProxy.loopValue}
      - sleep: 1s
  - name: job2
    echo: first
  - name: job3
    echo: second
```
In above example, job2, job3 will run step by step, but job1 run in background, the program will wait job1 done then finish the program  


## <a id="else"></a>else  
`It's a property in a tag`  
Check condition before run the item and skip the next cases when it passed  

Example:  

```yaml
  - vars:
      number: 11

  - if: ${$vars.number === 11}
    echo: Value is 11                   # => Value is 11

  - elseif: ${$vars.number > 10}
    echo: Value is greater than 10      # =>

  - else:
    echo: Value is lessthan than 10     # =>

  - echo: Done                          # => Done
```  


## <a id="elseif"></a>elseif  
`It's a property in a tag`  
Check condition before run the item and skip the next cases when it passed  

Example:  

```yaml
  - vars:
      number: 11

  - if: ${$vars.number === 11}
    echo: Value is 11                   # => Value is 11

  - elseif: ${$vars.number > 10}
    echo: Value is greater than 10      # =>

  - elseif: ${$vars.number < 10}
    echo: Value is lessthan than 10     # =>

  - echo: Done                          # => Done
```  


## <a id="failure"></a>failure  
`It's a property in a tag`  
Handle error when do something wrong. Default it will exit app when something error.
- ignore: Ignore error then keep playing the next
- restart:
max: 3     When got something error, it will be restarted automatically ASAP (-1/0 is same)
sleep: 3000  

Example:  

```yaml
  - failure:
      restart:                     # Try to restart 3 time before exit app. Each of retry, it will be sleep 3s before restart
        max: 3
        sleep: 3s
      ignore: true                 # After retry 3 time failed, it keeps playing, not exit
    js: |
      const a = 1/0
  - failure:
      ignore: true                 # Ignore error then play the next
    js: |
      const a = 1/0
```  


## <a id="icon"></a>icon  
`It's a property in a tag`  
Icon which is prepended before the step name  

Example:  

```yaml
  - ->: sleepID
    icon: ⏳
    template: 1000

  - name: Sleep in 1s       # => ⏳ Sleep in 1s
    <-: sleepID
    sleep: 1s

  - name: Sleep in 2s       # => ⏳ Sleep in 2s
    <-: sleepID
    sleep: 2s
```  


## <a id="id"></a>id  
`It's a property in a tag`  
ID Reference to element object in the $vars  

Example:  

```yaml
  - id: echo1
    echo: Hello

  - js: |
      this.logger.debug($vars.echo1.content)

```  


## <a id="if"></a>if  
`It's a property in a tag`  
Check condition before run the item  

Example:  

```yaml
  - vars:
      number: 11

  - if: ${$vars.number === 11}
    echo: Value is 11                   # => Value is 11

  - if: ${$vars.number > 10}
    echo: Value is greater than 10      # => Value is greater than 10

  - if: ${$vars.number < 10}
    echo: Value is lessthan than 10     # =>

  - echo: Done                          # => Done
```  


## <a id="loop"></a>loop  
`It's a property in a tag`  
Loop to run items with a condition.
Variables:
- `$lv`, `$loopValue`: Get loop value
- `$lk`, `$loopKey`: Get loop key  

Example:  

Loop in array
```yaml
  - vars:
      arrs: [1,2,3,4]
  - loop: ${$vars.arrs}
    echo: Index is ${$loopKey}, value is ${$loopValue}    # $loopKey ~ this.loopKey AND $loopValue ~ this.loopValue
  # =>
  # Index is 0, value is 1
  # Index is 1, value is 2
  # Index is 2, value is 3
  # Index is 3, value is 4
```

Loop in object
```yaml
  - vars:
      obj: {
        "name": "thanh",
        "sex": "male"
      }
  - loop: ${$vars.obj}
    echo: Key is ${$loopKey}, value is ${$loopValue}
  # =>
  # Key is name, value is thanh
  # Key is sex, value is male
```

Dynamic loop in a condition
```yaml
  - vars:
      i: 0
  - loop: ${$vars.i < 3}
    echo: value is ${$vars.i++}
  # =>
  # value is 0
  # value is 1
  # value is 2
```

Loop in nested items
```yaml
  - vars:
      arrs: [1,2,3]
  - loop: ${$vars.arrs}
    name: group ${$loopValue}
    runs:
      - echo: value is ${$loopValue}                                  # => item value is "1" then "2" then "3"

      - loop: ${ [4,5,6] }
        runs:
          - echo: value is ${$loopValue}                              # => item value is "4" then "5" then "6"

          - echo: parent is ${this.parentProxy.parentProxy.loopValue} # => item value is "1" then "2" then "3"
  # =>
  # group 1
  # item value is 1
```  


## <a id="name"></a>name  
`It's a property in a tag`  
Step name  

Example:  

```yaml
  - name: Sleep in 1s
    sleep: 1000
```  


## <a id="only"></a>only  
`It's a property in a tag`  
Only run this  

Example:  

```yaml
  - echo: Hi                   # No print "hi"

  - only: true
    echo: Hello                # Only print "Hello"

  - echo: world                # No print "world"

  - only: true
    echo: Bye                  # Only print "Bye"
```  


## <a id="parentState"></a>parentState  
`It's used in js code`  
- Set/Get value to context variables. Used in tags support `runs` and support parentState
Variables:
- `$ps`, `$parentState`: Reference to context state  

Example:  

```yaml
  - name: listen to handle an events
    event'on:
      name: test-event
    runs:
      - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
      - echo: ${ $ps.eventOpts }            # => [ params 1, params 2 ]

  - event'emit:
      name: test-event
      data:
        name: Test event
        data: Hello
      opts:
        - params 1
        - params 2
```
Acess $parentState incursive
```yaml
  - name: Connect to redis
    ymlr-redis:
      uri: redis://localhost:6379
    runs:
      - name: access redis
        js: |
          await $ps.redis.client.publish('test-event/ping', 'level 1')

      - name: after redis is connected, start listening to handle an events
        event'on:
          name: test-event
        runs:
          - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
          - echo: ${ $ps.eventOpts }            # => [ params 1, params 2 ]

          - name: access redis
            js: |
              await $ps.$ps.redis.client.publish('test-event/ping', 'level 2')

  - event'emit:
      name: test-event
      data:
        name: Test event
        data: Hello
      opts:
        - params 1
        - params 2
```  


## <a id="Prefix path"></a>Prefix path  
`Global Notes`  
Prefix path which is support in all of tags.
Can used in code by: proxy.getPath(pathOfFile: string)  

Example:  

```sh
  cd /app
  yaml /scene/my-root-scene.yaml
```
- `~~/`: map to run dir `/app/`
-  `~/`: map to root scene dir `/scene/`
- `~./`: map to current scene dir
-  `../`: map to parent directory of the current working file
-  `./`: map to directory of the current working file
-   `/`: absolute path  


## <a id="runs"></a>runs  
`It's a property in a tag`  
Steps will be run in the running element  

Example:  

```yaml
  - http'server:
      address: 0.0.0.0:1234
    runs:
      - echo: Do something when a request comes
      - echo: Do something when a request comes...
      ...

```  


## <a id="skip"></a>skip  
`It's a property in a tag`  
No run this  

Example:  

```yaml
  - echo: Hi                   # Print "hi"

  - skip: true
    echo: Hello                # No print "Hello"

  - echo: world                # Print "world"
```  


## <a id="skipNext"></a>skipNext  
`It's a property in a tag`  
Skip the next steps in the same parent group when done this  

Example:  

```yaml
  - loop: ${ [1,2,3] }
    runs:
      - echo: begin                                          # Always print begin

      - echo: ${ this.parentProxy.loopValue }
        skipNext: ${ this.parentProxy.loopValue === 2 }      # When $loopValue is 2, skip the next step

      - echo: end                                            # Only print end when $loopValue is not equals 2
```  


## <a id="template"></a>template  
`It's a property in a tag`  
Declare a template to extends later  

Example:  

```yaml
  - ->: localhost           # Auto skip, not run it
    template:
      baseURL: http://localhost:3000

  - <-: localhost           # => Auto inherits "baseURL" from localhost
    http'get:
      url: /items
```  


## <a id="vars"></a>vars  
`It's a property in a tag`  
- Set value in the item to global vars to reused later
- Declare and set value to variables to reused in the scene/global scope
- If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
- If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene
Variables:
- `$v`, `$vars`: Reference to variables  

Example:  

A main scene file
```yaml
  - echo: Hello world
    vars: helloText             # Save output from echo to global variable "helloText"
  - echo: ${$vars.helloText}    # => Hello world

  - vars:
      MainName: global var      # Is used in all of scenes
      mainName: local var       # Only used in this scene

  - scene:
      path: ./child.scene.yaml

  - fetch'get:
      url: http://localhost/data.json
    vars:
      myResponseData: ${ this.$.response.data }                         # Assign response data to scene variable
      MyResponseData: ${ this.$.response.data }                         # Assign response data to global variable
      _: ${ $parentState.responseDataInContext = this.$.response.data } # Assign response data to context variable

  - echo: ${$vars.MainName}      # => global var
  - echo: ${$vars.mainName}      # => local var
  - echo: ${$vars.name}          # => undefined
  - echo: ${$vars.Name}          # => global name here
```
A scene file `child.scene.yaml` is:
```yaml
  - vars:
      Name: global name here
      name: scene name here     # Only used in this scene

  - echo: ${$vars.MainName}      # => global var
  - echo: ${$vars.mainName}      # => undefined
  - echo: ${$vars.name}          # => scene name here
  - echo: ${$vars.Name}          # => global name here
```  



## <a id="md'doc"></a>md'doc  
`doc`  
Generate comment in a file to document  

Example:  

```yaml
  - doc'md:
      includeDirs:
        - /workspaces/ymlr/src/components/doc/md.ts
      includePattern: "^(?!.*\\.spec\\.ts$)"
      excludeDirs:
        - node_modules
      prependMDs:                                     # Prepend content in the document (Optional)
        - path: ../INSTALLATION.md                    # |- {path}: Read file content then copy it into document
        - ---                                         # |- string: Markdown content
      appendMDs:                                      # Append content in the document
        - ---
        - "### Have fun :)"
      saveTo: /workspaces/ymlr/test/thanh.doc.md
```
Declare doc in file
[Example](https://github.com/circle2jt/ymlr/blob/main/src/components/doc/md.ts)  


## <a id="echo"></a>echo  
  
Print to console screen  

Example:  

Print a message
```yaml
  - echo: Hello world

  - echo:
      if: ${true}
      content: Hello
```

Print a variable
```yaml
  - vars:
      name: thanh
  - echo: ${ $vars.name }
```

Print text with custom type. (Follow "chalk")
```yaml
  - echo: Color is white

  - echo:
      styles: [red]
      content: Color is red
  - echo:
      styles: [red, bold]
      content: Content is red and bold
```  


## <a id="echo'debug"></a>echo'debug  
  
Add more information when print to console screen  

Example:  

Print a message
```yaml
                                            # Default prepend execution time into log
  - echo'debug: Hello world                 # => 01:01:01.101    Hello world

  - echo'debug:
      formatTime: YYYY/MM/DD hh:mm:ss.ms    # Default format is "hh:mm:ss.ms"
      content: Hello                        # => 2023/01/01 01:01:01.101    Hello
```  


## <a id="clear"></a>clear  
  
Clear console screen  

Example:  

```yaml
  - clear:
```  


## <a id="event'emit"></a>event'emit  
  
Send data via global event  

Example:  

```yaml
  - name: send data to an event
    event'emit:
      name: test-event
      data:
        name: Test event
        data: Hello
      opts:
        - params 1
        - params 2

  - name: send data to multiple events
    event'emit:
      names:
        - test-event1
        - test-event2
        - test-event3
      data:
        name: Test event
        data: Hello
      opts:
        - params 1
        - params 2
```  


## <a id="event'on"></a>event'on  
  
Handle global events in app  

Example:  

```yaml
  - name: listen to handle an events
    event'on:
      name: test-event
    runs:
      - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
      - echo: ${ $parentState.eventOpts }   # => [ params 1, params 2 ]

  - name: listen to handle multiple events
    event'on:
      names:
        - test-event1
        - test-event2
        - test-event3
    runs:
      - echo: ${ $parentState.eventData }   # => { name: Test event, data: Hello }
      - echo: ${ $parentState.eventOpts }   # => [ params 1, params 2 ]
```
```yaml
  - event'emit:
      name: test-event
      data:
        name: Test event
        data: Hello
      opts:
        - params 1
        - params 2
```  


## <a id="fn-debounce"></a>fn-debounce  
  
Debounce function (#Ref: lodash.debounce)
- Without "wait" and "runs" then it's only touch with last agruments
- Specific "wait" and "runs" then it's run with new agruments  

Example:  

```yaml
  - fn-debounce:
      name: Delay to do something
      wait: 1s                # The number of milliseconds to delay.
      trailing: true          # Specify invoking on the trailing edge of the timeout. Default is true
      leading: false          # Specify invoking on the leading edge of the timeout. Default is false
      maxWait: 2s             # The maximum time func is allowed to be delayed before it's invoked.
      autoRemove: true        # Auto remove it when reached the event. Default is false.
    runs:
      - echo: Do this when it's free for 1s

  # touch if debounce is existed
  - fn-debounce:                          # Touch the existed throttle with last agruments
      name: Delay to do something
  # OR
  - fn-debounce: Delay to do something    # Touch the existed throttle with last agruments
```  


## <a id="fn-debounce'cancel"></a>fn-debounce'cancel  
  
Cancel debounce function (#Ref: lodash.debounce)  

Example:  

```yaml
  - fn-debounce'cancel:
      name: Delay to do something               # Debounce name to cancel
  # OR
  - fn-debounce'cancel: Delay to do something   # Debounce name to cancel
  # OR
  - fn-debounce'cancel:
      - delay1
      - delay2
```  


## <a id="fn-debounce'del"></a>fn-debounce'del  
  
Cancel & remove debounce function (#Ref: lodash.debounce)  

Example:  

```yaml
  - fn-debounce'del:
      name: Delay to do something               # Debounce name to delete
  # OR
  - fn-debounce'del: Delay to do something      # Debounce name to delete
  # OR
  - fn-debounce'del:
      - delay1
      - delay2
```  


## <a id="fn-debounce'flush"></a>fn-debounce'flush  
  
Force to call debounce function ASAP if it's called before that (#Ref: lodash.debounce)  

Example:  

```yaml
  - fn-debounce'flush:
      name: Delay to do something                 # Debounce name to delete
  # OR
  - fn-debounce'flush: Delay to do something      # Debounce name to delete
  # OR
  - fn-debounce'flush:
      - delay1
      - delay2
```  


## <a id="fn-debounce'touch"></a>fn-debounce'touch  
  
touch debounce function. Reused last agruments(#Ref: lodash.debounce)  

Example:  

```yaml
  - fn-debounce'touch:
      name: Delay to do something               # Debounce name to touch
  # OR
  - fn-debounce'touch: Delay to do something    # Debounce name to touch
  # OR
  - fn-debounce'touch:
      - delay1
      - delay2
```  


## <a id="fn-queue"></a>fn-queue  
  
Register a queue job  

Example:  

```yaml
  - fn-queue:
      name: My Queue 1        # Use stateless queue, not reload after startup
      concurrent: 2
    runs:
      - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }

  - fn-queue'add:
      name: My Queue 1
      data:
        key1: value1
        key2: value 2
```

```yaml
  - fn-queue:
      name: My Queue 1
      concurrent: 2
      skipError: false       # Not throw error when a job failed
      db:                    # Optional: Statefull queue, it's will reload after startup
        path: /tmp/db        #  - Optional: Default is "tempdir/queuename"
        password: abc        #  - Optional: Default is no encrypted by password
    runs:
      - echo: ${ $parentState.queueData.key1 } is ${ $parentState.queueData.value1 }

  - fn-queue'add:
      name: My Queue 1
      data:
        key1: value1
        key2: value 2
```  


## <a id="fn-queue'add"></a>fn-queue'add  
  
Add a job to an exsited queue  

Example:  

```yaml
  - fn-queue'add:
      name: My Queue 1                 # Queue name to add
      data:                            # Job data
        key1: value1
```  


## <a id="fn-queue'del"></a>fn-queue'del  
  
Stop and remove a queue  

Example:  

```yaml
  - fn-queue'del:
      name: My Queue 1                 # Queue name to delete
  # OR
  - fn-queue'del: My Queue 1           # Queue name to delete
```  


## <a id="fn-singleton"></a>fn-singleton  
  
This is locked before run and unlock after done. When it's called many time, this is only run after unlock  

Example:  

```yaml
  - fn-singleton:
      name: Only run 1 time
      trailing: true              # When someone call in the running but it's not finished yet, then it will run 1 time again after is unlocked
    runs:
      - echo: Do this when it's free for 1s
```  


## <a id="fn-singleton'del"></a>fn-singleton'del  
  
Remove singleton function  

Example:  

```yaml
  - fn-singleton'del:
      name: Delay to do something                 # Singleton name to delete
  # OR
  - fn-singleton'del: Delay to do something       # Singleton name to delete
```  


## <a id="fn-throttle"></a>fn-throttle  
  
Throttle function (#Ref: lodash.throttle)
- Without "wait" and "runs" then it's only touch with last agruments
- Specific "wait" and "runs" then it's run with new agruments  

Example:  

```yaml
  - fn-throttle:
      name: Delay to do something
      wait: 1s            # The number of milliseconds to throttle invocations to.
      trailing: true      # Specify invoking on the trailing edge of the timeout. Default is true
      leading: true       # Specify invoking on the leading edge of the timeout. Default is true
      autoRemove: true    # Auto remove it when reached the event. Default is false
    runs:
      - echo: Do this when it's free for 1s

  # Call if throttle is existed
  - fn-throttle:                         # Touch the existed throttle with last agruments
      name: Delay to do something
  # OR
  - fn-throttle: Delay to do something   # Touch the existed throttle with last agruments
```  


## <a id="fn-throttle'cancel"></a>fn-throttle'cancel  
  
Cancel throttle function (#Ref: lodash.throttle)  

Example:  

```yaml
  - fn-throttle'cancel:
      name: Delay to do something               # Throttle name to cancel
  # OR
  - fn-throttle'cancel: Delay to do something   # Throttle name to cancel
  # OR
  - fn-throttle'cancel:
      - delay1
      - delay2
```  


## <a id="fn-throttle'del"></a>fn-throttle'del  
  
Cancel & remove throttle function (#Ref: lodash.throttle)  

Example:  

```yaml
  - fn-throttle'del:
      name: Delay to do something               # Throttle name to delete
  # OR
  - fn-throttle'del: Delay to do something      # Throttle name to delete
  # OR
  - fn-throttle'del:
      - delay1
      - delay2
```  


## <a id="fn-throttle'flush"></a>fn-throttle'flush  
  
Force to call throttle function ASAP if it's called before that (#Ref: lodash.throttle)  

Example:  

```yaml
  - fn-throttle'flush:
      name: Delay to do something                 # Throttle name to delete
  # OR
  - fn-throttle'flush: Delay to do something      # Throttle name to delete
  # OR
  - fn-throttle'flush:
      - delay1
      - delay2
```  


## <a id="fn-throttle'touch"></a>fn-throttle'touch  
  
touch throttle function. Reused last agruments (#Ref: lodash.throttle)  

Example:  

```yaml
  - fn-throttle'touch:
      name: Delay to do something               # Throttle name to touch
  # OR
  - fn-throttle'touch: Delay to do something   # Throttle name to touch
  # OR
  - fn-throttle'touch:
      - delay1
      - delay2
```  


## <a id="exit"></a>exit  
  
Stop then quit the program  

Example:  

```yaml
  - exit: 0

  - name: Throw error
    exit: 1
```  


## <a id="fetch'del"></a>fetch'del  
  
Send a http request with DELETE method  

Example:  

```yaml
  # DELETE http://localhost:3000/posts/1?method=check_existed
  - name: Delete a post
    fetch'del:
      url: /posts/1
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        method: check_existed
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars:                             # !optional - Global variable which store value after executed
      status: ${this.$.response.status}
```  


## <a id="fetch'get"></a>fetch'get  
  
Send a http request with GET method  

Example:  

Get data from API then store value in `vars.posts`
```yaml
  # GET http://localhost:3000/posts?category=users
  - name: Get list posts
    fetch'get:
      url: /posts
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        category: users
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      responseType: json              # !optional - Default is json ['json' | 'blob' | 'text' | 'buffer' | 'none']
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: posts                       # !optional - Global variable which store value after executed
```

Download file from a API
```yaml
  # GET http://localhost:3000/posts?category=users
  - name: Download a file
    fetch'get:
      baseURL: http://localhost:3000
      url: /posts
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      saveTo: /tmp/post.json
```  


## <a id="fetch'head"></a>fetch'head  
  
Send a http request with HEAD method  

Example:  

```yaml
  # HEAD http://localhost:3000/posts/1?method=check_existed
  - name: Check post is existed or not
    fetch'head:
      baseURL: http://localhost:
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
                                      # supported: d h m s ~ day, hour, minute, seconds
                                      # example: 1h2m3s ~ 1 hour, 2 minutes, 3 seconds
      url: /posts/1
      query:
        method: check_existed
      headers:
        authorization: Bearer TOKEN
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars:
      status: ${this.response?.status}
```  


## <a id="fetch'patch"></a>fetch'patch  
  
Send a http request with PATCH method  

Example:  

Update apart of data to API then store value in `vars.posts`
```yaml
  # PATCH http://localhost:3000/posts/ID?category=users
  - name: Update a post
    fetch'patch:
      baseURL: http://localhost:3000
      url: /posts/ID
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: newPost
```
Upload file to server
```yaml
  # PATCH http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - name: Upload and update data
    fetch'patch:
      baseURL: http://localhost:3000
      url: /upload/ID_UPLOADER_TO_REPLACE
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/new_my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
    vars:
      status: ${this.$.response.status}
```  


## <a id="fetch'post"></a>fetch'post  
  
Send a http request with POST method  

Example:  

Post data to API then store value in `vars.posts`
```yaml
  # POST http://localhost:3000/posts?category=users
  - name: Create a new post
    fetch'post:
      baseURL: http://localhost:3000
      url: /posts
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
    vars: newPost
```
Upload file to server
```yaml
  # POST http://localhost:3000/upload
  - name: Upload a new avatar
    fetch'post:
      baseURL: http://localhost:3000
      url: /upload
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "category": "avatar",
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars:
      status: ${this.$.response.status}
```  


## <a id="fetch'put"></a>fetch'put  
  
Send a http request with PUT method  

Example:  

Update data to API then store value in `vars.posts`
```yaml
  # PUT http://localhost:3000/posts/ID?category=users
  - name: Update a post
    fetch'put:
      baseURL: http://localhost:3000
      url: /posts/ID
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: newPost
```
Upload file to server
```yaml
  # PUT http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - name: Upload and update data
    fetch'put:
      baseURL: http://localhost:3000
      url: /upload/ID_UPLOADER_TO_REPLACE
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "category": "avatar updated",
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/new_my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
    vars:
      status: ${this.$.response.status}
```  


## <a id="file'read"></a>file'read  
  
Read a file then load data into a variable  

Example:  

Read a json file
```yaml
  - file'read:
      path: /tmp/data.json
      format: json  # !optional
    vars: fileData
```
Read a yaml file
```yaml
  - file'read:
      path: /tmp/data.yaml
      format: yaml  # !optional
    vars: fileData
```
Read a text file
```yaml
  - file'read:
      path: /tmp/data.txt
    vars: fileContent
```  


## <a id="file'store"></a>file'store  
  
Store data to file  

Example:  

```yaml
  - file'store:
      path: /tmp/data.json      # Path to store data
      password:                 # Password to encrypt/decrypt data content
      initData: []              # Default data will be stored when file not found
```

Use in global by reference
```yaml
  - file'store:
      path: /tmp/data.yaml
      initData: []
    vars:
      fileDB: ${this}         # Store this element to "fileDB" in vars

  - js: |
      const { fileDB } = vars
      fileDB.data.push('item 1')
      fileDB.data.push('item 2')
      // Save data to file
      fileDB.save()

  - echo: ${$vars.fileDB.data}   # => ['item 1', 'item 2']
```  


## <a id="file'write"></a>file'write  
  
Write data to file  

Example:  

Write a json file
```yaml
  - file'write:
      path: /tmp/data.json
      content: {
        "say": "hello"
      }
      format: json  # !optional
      pretty: true  # !optional
      opts:             # ref: https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback
        mode: 775
        flag: r         # ref: https://nodejs.org/api/fs.html#file-system-flags
```
Write a yaml file
```yaml
  - file'write:
      path: /tmp/data.yaml
      content: ${$vars.fileData}
      format: yaml  # !optional
```
Write a text file
```yaml
  - file'write:
      path: /tmp/data.txt
      content: Hello world
```  


## <a id="http'del"></a>http'del  
  
Send a http request with DELETE method  

Example:  

```yaml
  # DELETE http://localhost:3000/posts/1?method=check_existed
  - name: Delete a post
    http'del:
      url: /posts/1
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        method: check_existed
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars:                             # !optional - Global variable which store value after executed
      status: ${this.$.response.status}
```  


## <a id="http'get"></a>http'get  
  
Send a http request with GET method  

Example:  

Get data from API then store value in `vars.posts`
```yaml
  # GET http://localhost:3000/posts?category=users
  - name: Get list posts
    http'get:
      url: /posts
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        category: users
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      responseType: json              # !optional - Default is json ['json' | 'blob' | 'text' | 'buffer' | 'none']
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: posts                       # !optional - Global variable which store value after executed
```

Download file from a API
```yaml
  # GET http://localhost:3000/posts?category=users
  - name: Download a file
    http'get:
      baseURL: http://localhost:3000
      url: /posts
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      saveTo: /tmp/post.json
```  


## <a id="http'head"></a>http'head  
  
Send a http request with HEAD method  

Example:  

```yaml
  # HEAD http://localhost:3000/posts/1?method=check_existed
  - name: Check post is existed or not
    http'head:
      baseURL: http://localhost:
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
                                      # supported: d h m s ~ day, hour, minute, seconds
                                      # example: 1h2m3s ~ 1 hour, 2 minutes, 3 seconds
      url: /posts/1
      query:
        method: check_existed
      headers:
        authorization: Bearer TOKEN
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars:
      status: ${this.response?.status}
```  


## <a id="http'patch"></a>http'patch  
  
Send a http request with PATCH method  

Example:  

Update apart of data to API then store value in `vars.posts`
```yaml
  # PATCH http://localhost:3000/posts/ID?category=users
  - name: Update a post
    http'patch:
      baseURL: http://localhost:3000
      url: /posts/ID
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: newPost
```
Upload file to server
```yaml
  # PATCH http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - name: Upload and update data
    http'patch:
      baseURL: http://localhost:3000
      url: /upload/ID_UPLOADER_TO_REPLACE
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/new_my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
    vars:
      status: ${this.$.response.status}
```  


## <a id="http'post"></a>http'post  
  
Send a http request with POST method  

Example:  

Post data to API then store value in `vars.posts`
```yaml
  # POST http://localhost:3000/posts?category=users
  - name: Create a new post
    http'post:
      baseURL: http://localhost:3000
      url: /posts
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: newPost
```
Upload file to server
```yaml
  # POST http://localhost:3000/upload
  - name: Upload a new avatar
    http'post:
      baseURL: http://localhost:3000
      url: /upload
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "category": "avatar",
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
    vars:
      status: ${this.$.response.status}
```  


## <a id="http'put"></a>http'put  
  
Send a http request with PUT method  

Example:  

Update data to API then store value in `vars.posts`
```yaml
  # PUT http://localhost:3000/posts/ID?category=users
  - name: Update a post
    http'put:
      baseURL: http://localhost:3000
      url: /posts/ID
      query:
        category: users
      headers:
        authorization: Bearer TOKEN
      type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      body: {
        "title": "My title",
        "description": "My description"
      }
      responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      validStatus: [200, 204, 400]    # !optional - Expect these response status codes is success and not throw error
    vars: newPost
```
Upload file to server
```yaml
  # PUT http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - name: Upload and update data
    http'put:
      baseURL: http://localhost:3000
      url: /upload/ID_UPLOADER_TO_REPLACE
      headers:
        authorization: Bearer TOKEN
      type: multipart
      body: {
        "category": "avatar updated",
        "file": { # File upload must includes path of file, name is optional
          "path": "/tmp/new_my_avatar.jpg",
          "name": "thanh_avatar"
        }
      }
    vars:
      status: ${this.$.response.status}
```  


## <a id="http'server"></a>http'server  
  
Create a http server to serve content via http  

Example:  

```yaml
  - http'server:
      address: 0.0.0.0:8811                   # Address to listen
      auth:                                   # Check authentication
        basic:                                # 'Basic ' + base64(`${username}:${password}`)
          username: username
          password: password
        custom:
          secret: 'SERVER_SECRET_TOKEN'
          secretKey: SECRET_HEADER_KEY
          verify(): |
            return $parentState.headers[this.secretKey] === this.secret
      // cors: {}                           # enable all cors requests
      cors:                                 # Ref: https://www.npmjs.com/package/cors#configuring-cors
        origin: '*'
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
        allowedHeaders: ['Content-Type', 'Authorization']
        exposedHeaders: ['Content-Range', 'X-Content-Range']
        credentials?: boolean | undefined;
        maxAge?: number | undefined;
        preflightContinue: false
        optionsSuccessStatus: 204
      opts:
        timeout: 0                          # The number of milliseconds of inactivity before a socket is presumed to have timed out.
        keepAliveTimeout: 0                 # The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed
        headersTimeout: 0                   # Limit the amount of time the parser will wait to receive the complete HTTP headers.
        maxConnections: 0                   # Set this property to reject connections when the server's connection count gets high.
        maxHeadersCount: 0                  # Limits maximum incoming headers count. If set to 0, no limit will be applied.
        maxRequestsPerSocket: 0             # The maximum number of requests socket can handle before closing keep alive connection.
        requestTimeout: 0                   # Sets the timeout value in milliseconds for receiving the entire request from the client.
    runs:                                   # Execute when a request comes
      - echo: ${ $parentState.path }        # Get request path
      - echo: ${ $parentState.method }      # Get request method
      - echo: ${ $parentState.headers }     # Get request headers
      - echo: ${ $parentState.query }       # Get request query string
      - echo: ${ $parentState.body }        # Get request body
      - echo: ${ $parentState.response }    # Set response data
                                            # - status: 200       - http response status
                                            # - statusMessage: OK - http response status message
                                            # - headers: {}       - Set response headers
                                            # - data: {}          - Set response data
      - echo: ${ $parentState.req }         # Ref to req in http.IncomingMessage in nodejs
      - echo: ${ $parentState.res }         # Ref to res in http.ServerResponse in nodejs
      - js: |                               # Handle response by yourself (When $parentState.response is undefined)
          $parentState.res.status = 200
          $parentState.res.statusMessage = 'OK'
          $parentState.res.write('OK')
          $parentState.res.end()
```  


## <a id="include"></a>include  
  
Include a scene file or list scene files in a folder  

Example:  

```yaml
  - include: ./my-scenes/scene1.yaml                    # Includes a only file "scene1.yaml"

  - include:
      cached: true                                      # Load file for the first time, the next will get from caches
      files: ./my-scenes                                # Includes all of files (.yaml, .yml) which in the directory (./my-scenes)
      validFilePattern: ^[a-zA-Z0-9].*?\.stack\.ya?ml$  # Only load files which ends with .stack.yaml
      validDirPattern: ^[a-zA-Z0-9]                     # Only scan files in these valid directories
      maxDeepLevel: 0                                   # Max deep child directories to scan files

  - include:
      - file1.yaml
      - file2.yaml
      - file3.yaml

  - include:
      cached: true
      files:
        - file1.yaml
        - file2.yaml
        - file3.yaml
```  


## <a id="input'confirm"></a>input'confirm  
  
Get user confirm (yes/no)  

Example:  

```yaml
# - input'conf:
  - input'confirm:
      title: Are you sure to delete it ?
      default: false  # !optional
      required: true  # !optional
    vars: userWantToDelete
```  


## <a id="input'multiselect"></a>input'multiselect  
  
Suggest a list of choices for user then allow pick multiple choices  

Example:  

```yaml
# - input'msel:
  - input'multiselect:
      title: Please select your hobbies ?
      choices:
        - title: Tennis
          value: tn
        - title: Football
          value: fb
        - title: Basket ball
          value: bb
      default: [tn, fb]   # !optional
      required: true      # !optional
    vars: hobbies
```  


## <a id="input'number"></a>input'number  
  
Get user input from keyboard then convert to number  

Example:  

```yaml
# - input'num:
  - input'number:
      title: Enter your age ?
      default: 18     # !optional
      required: true  # !optional
    vars: age
```  


## <a id="input'password"></a>input'password  
  
Get user input from keyboard but hide them then convert to text  

Example:  

```yaml
# - input'pwd:
  - input'password:
      title: Enter your password ?
      required: true  # !optional
    vars: password
```  


## <a id="input'select"></a>input'select  
  
Suggest a list of choices for user then allow pick a choice  

Example:  

```yaml
# - input'sel:
  - input'select:
      title: Your sex ?
      choices:
        - title: male
          value: m
        - title: female
          value: f
      default: m      # !optional
      required: true  # !optional
    vars: sex
```  


## <a id="input'suggest"></a>input'suggest  
  
Suggest a list of choices for user then allow pick a choice or create a new one  

Example:  

```yaml
# - input'sug:
  - input'suggest:
      title: Your hobby
      choices:
        - title: Football
          value: football
        - title: Basket Ball
          value: backetball
      default: football                         # !optional
      required: true                            # !optional
      suggestType: INCLUDE_AND_ALLOW_NEW        # Must be in [STARTSWITH_AND_ALLOW_NEW, INCLUDE_AND_ALLOW_NEW, STARTSWITH, INCLUDE]
                                                # - "INCLUDE": Only find in the text in the list suggestions
                                                # - "INCLUDE_AND_ALLOW_NEW": Same "INCLUDE" and allow to create a new one if not in the list suggestions
                                                # - "STARTSWITH": Only find in the start of text
                                                # - "STARTSWITH_AND_ALLOW_NEW": Same "STARTSWITH" and allow to create a new one if not in the list suggestions
    vars: hobby
```  


## <a id="input'text"></a>input'text  
  
Get user input from keyboard then convert to text  

Example:  

```yaml
# - input:
  - input'text:
      title: Enter your name
      default: Noname # !optional
      required: true  # !optional
    vars: name
```  


## <a id="js"></a>js  
  
Execute a nodejs code  

Example:  

Set value to a variable
```yaml
  - name: Set value to a variable
    js: |
      vars.name = 'thanh'
      logger.info(vars.name)
```

Write a file
```yaml
  - name: Write a file
    js:
      path: /sayHello.sh              # Path of js file (Use only "path" OR "script")
      script: |                       # NodeJS content
        const { writeFileSync } = require('fs')
        writeFileSync('/tmp/hello.txt', 'Hello world')
        return "OK"
    vars: result                      # !optional
```  


## <a id="npm'install"></a>npm'install  
  
Install librarries to use in the scene.  

Example:  

```yaml
  - npm'install: module1, module2

  - npm'install:
      - module1
      - myapp: git+ssh:git@github.com:...

  - Always get latest ymlr-telegram librarry
    npm'install: [lodash, ymlr-telegram@latest]

  # How to used
  - js: |
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
  


## <a id="npm'uninstall"></a>npm'uninstall  
  
Uninstall librarries to use in the scene.  

Example:  

```yaml
  - npm'uninstall: module1, module2

  - npm'uninstall:
      - module1
      - myapp

  - name: Uninstall librarry
    npm'uninstall: [ymlr-telegram, ymlr...]
```  


## <a id="pause"></a>pause  
  
Pause the program then wait to user enter to continue  

Example:  

```yaml
  - pause:

  - name: Pause here
    pause:
```  


## <a id="runs"></a>runs  
  
Group elements  

Example:  

```yaml
  - name: Print all of message
    runs:
      - echo: hello
      - echo: world
      - name: Stop
        runs:
          - exit:
```  


## <a id="scene"></a>scene  
  
Load another scene into the running program  

Example:  

```yaml
  - name: A scene from remote server
    # scene: ./another.yaml             # path can be URL or local path
    scene:
      name: Scene name
      path: https://.../another.yaml    # path can be URL or local path
      cached: false                     # caches yaml content to ram to prevent reload content from a file
      password:                         # password to decode when the file is encrypted
      env:                              # Set to env variable. Support an array or object (- key=value) (key: value)
        NODE_ENV: production
        # Or
        - NODE_ENV=production
      vars:                             # They will only overrides vars in the parents to this scene
                                        # - Global variables is always passed into this scene
        foo: scene bar                  # First is lowercase is vars which is used in scenes
        Foo: Global bar                 # First is uppercase is global vars which is used in the program
        localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
      envFiles:                         # Load env variable from files (string | string[])
        - .env
        - .env.dev
      varsFiles:                        # Load vars from json or yaml files (string | string[])
        - ./var1.json
        - ./var2.yaml
```  


## <a id="scene'returns"></a>scene'returns  
  
Return value to parent scene  

Example:  

Scene `sum.yaml`
```yaml
  vars:
    x: 0
    y: 0
  runs:
    - vars:
        result: ${ $vars.x + $vars.y }

    - scene'returns: ${ $vars.result }
```
Main scene `index.yaml`
```yaml
  - name: Load a scene to sum 2 digits
    scene:
      path: .../sum.yaml
      vars:
        x: 10
        y: 20
    vars: sumOfXY

  - echo: ${ $vars.sumOfXY }    # => 30
```  


## <a id="scene'thread"></a>scene'thread  
  
Same "scene" but it run in a new thread  

Example:  

```yaml
  - name: A scene run in a new thread
    # scene'thread: ./another.yaml     # path can be URL or local path
    scene'thread:
      id: #newID                        # thread id (optional)
      name: Scene name
      path: https://.../another.yaml    # path can be URL or local path
      password:                         # password to decode when the file is encrypted
      vars:                             # They will only overrides vars in the parents to this scene
                                        # - Global variables is always passed into this scene
        foo: scene bar                  # First is lowercase is vars which is used in scenes
        Foo: Global bar                 # First is uppercase is global vars which is used in the program
        localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
```

Send data via global event between threads and each others. (Includes main thread)
`main.yaml`
```yaml
  name: This is main thread
  runs:
    - name: Run in a new thread 1
      detach: true
      scene'thread:
        id: thread1
        path: ./new_thread.yaml
        vars:
          name: thread 1
    - name: Run in a new thread 2
      detach: true
      scene'thread:
        id: thread2
        path: ./new_thread.yaml
        tagDirs:                  # Custom tagDirs in the scene'thread. If not specific then default is inherit
          - ...                   # Inherits tags dirs in application. Ref to "-x" in cli
          - ./project1/dist
          - ./project2/dist
        vars:
          name: thread 2

    - sleep: 1s

    - name: Listen data from childs thread
      ~event'on:
        name: ${ $const.FROM_GLOBAL_EVENT }
      runs:
        - name: Received data from thread ID ${ $parentState.eventOpt.fromID }
          echo: ${ $parentState.eventData }

    - name: Emit data to childs threads
      ~event'emit:
        name: ${ $const.TO_GLOBAL_EVENT }
        data:
          name: this is data from main thread
```

`new_thread.yaml`
```yaml
  vars:
    name: Thread name will be overried by parent scene
  runs:
    - event'on:
        name: ${ $const.FROM_GLOBAL_EVENT }
      runs:
        - name: Thread ${ $vars.name } is received data from thread ID ${ $parentState.eventOpt.fromID }
          echo: ${ $parentState.eventData }

        - name: Thead ${ $vars.name } sent data to global event
          event'emit:
            name: ${ $const.TO_GLOBAL_EVENT }
            data:
              name: this is data from thread ${ $vars.name }
            # opts:
            #  toIDs: ['thread1']             # Specific the thread ID to send. Default it send to all
        - sleep: 2s
        - stop:

```  


## <a id="sh"></a>sh  
  
Execute a bash script or shell file  

Example:  

Execute a sh file
```yaml
  - name: Write a hello file
    sh:
      path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
      args:
        - world
    vars: log       # !optional
```

Execute a bash script
```yaml
  - name: Write a hello file
    sh:
      exitCodes: [0, 1]               # expect exit code is 0, 1 is success. Default is [0]
      script: |                       # Shell script content
        touch hello.txt
        echo "Hello world" > /tmp/hello.txt
      bin: /bin/sh                    # !optional. Default use /bin/sh to run sh script
      timeout: 10m                    # Time to run before force quit
      process: true                   # Create a new child process to execute a long task. Default is false
      plainExecuteLog: true           # Not prepend timestamp, loglevel... in the execution log. Only native message
      opts:                           # Ref: "SpawnOptionsWithoutStdio", "ExecFileOptions" in nodeJS
        detached: true
        ...
    vars: log                         # !optional
```  


## <a id="sleep"></a>sleep  
  
Sleep the program then wait to user enter to continue  

Example:  

Sleep for a time
- 1d = 1 day
- 1h = 1 hour
- 1m = 1 minute
- 1s = 1 second
- 1ms = 1 milisecond
```yaml
  - sleep: 10000            # Sleep 10s then keep continue
  - sleep: 10s              # Sleep 10s then keep continue
  - sleep: 1h1m20s          # Sleep in 1 hour, 1 minute and 20 seconds then keep continue
```

Full props
```yaml
  - name: Sleep 10s
    sleep: 10000          # Sleep 10s then keep continue

  - name: sleep infinity
    sleep:

```  


## <a id="tag'register"></a>tag'register  
  
Register custom tags from code or npm module, github....  

Example:  

Register custom tags from a file
```yaml
  - tag'register:
      test1: /workspaces/ymlr/test/resources/test.js       # { tagName: pathOfModule }

  - test1:
      foo: bar
```

Register custom tags from an object
```yaml
  - tag'register:
      newOne: |
        {
          constructor(props) {
            Object.assign(this, props)
          },
          async asyncConstructor(props) {
            // Do async job to init data
          },
          exec() {
            this.logger.info('ok ' + this.name, this.tag)
          },
          dispose() {
            // Dispose after finished this
          }
        }

  - newOne:
      name: foo
```

Register custom tags from a class
```yaml
  - tag'register:
      newOne: |
        class {
          constructor(props) {
            Object.assign(this, props)
          }
          async asyncConstructor(props) {
            // Do async job to init data
          }
          exec() {
            this.logger.info('ok ' + this.name, this.tag)
          }
          dispose() {
            // Dispose after finished this
          }
        }

  - newOne:
      name: foo
```  


## <a id="test"></a>test  
  
Check conditions in the program  

Example:  

Quick test
```yaml
  - test:
      title: Number must be greater than 10
      check: ${$vars.age > 10}
      stopWhenFailed: true

  - test: ${$vars.age < 10}
```

Test with nodejs script
```yaml
  - test:
      title: Number must be greater than 10
      script: |
        if (vars.age > 10) this.$.failed('Age is not valid')
```  


## <a id="view'flow"></a>view'flow  
  
View flows in a scene  

Example:  

Quick test
```yaml
  - view'flow:
      file: ~/index.yaml        # Path of a scene file
      saveTo: /tmp/index.txt    # Save the result to file or console. Default is console (Optional)
```  


## <a id="ymlr'load"></a>ymlr'load  
  
Merge, replace env variable in yaml files to a yaml file  

Example:  

```yaml
  vars:
    myRegistry: registry.docker.lan:5000
    rootEnv:
      serverDir: /home/myapp
  runs:
    - ymlr'load:
        path: /test/test.stack.yaml                         # Path of dir or file which is need to eval variable or auto includes
        saveTo: /test/test.done.stack.yaml                  # Path of the target file which is merged and replaced variables
        validFilePattern: ^[a-zA-Z0-9].*?\.stack\.ya?ml$    # Only handle files which is ends with .stack.yaml
        validDirPattern: ^[A-Za-z0-9]                       # Only scan directories which start with by a-zA-Z or a digit
```

file `test.stack.yaml`
```yaml
  include:                                # Support "include" tag to include files or folders
    files:
      - /app/nfs.stack.yaml

  services:
    smb:
      user: "0:0"
      image: ${ $v.myRegistry }/smb
      container_name: smb
      restart: always
      network_mode: host
      volumes:
        - /mnt:/mnt:z,shared
        - /home/orangepi:/home/orangepi:z,shared
        - ${ $v.rootEnv.serverDir }/stacks/smb/config/smb.conf:/etc/samba/smb.conf:ro
        - ${ $v.rootEnv.serverDir }/stacks/smb/config/usermap.txt:/etc/samba/usermap.txt:ro
```

file `nfs.stack.yaml`
```yaml
  services:
    nfs:
      image: ${ $v.myRegistry }/nfs
```

file `test.done.stack.yaml`
```yaml
  services:
    nfs:
      image: registry.docker.lan:5000/nfs
    smb:
      user: "0:0"
      image: registry.docker.lan:5000/smb
      container_name: smb
      restart: always
      network_mode: host
      volumes:
        - /mnt:/mnt:z,shared
        - /home/orangepi:/home/orangepi:z,shared
        - /home/myapp/stacks/smb/config/smb.conf:/etc/samba/smb.conf:ro
        - /home/myapp/stacks/smb/config/usermap.txt:/etc/samba/usermap.txt:ro
```  



## <a id="$utils.base64"></a>$utils.base64  
`Utility function`  
Base64 encrypt/decrypt a string  

Example:  

```yaml
  - echo: ${ $utils.base64.encode('hello world') }

  - echo: ${ $utils.base64.decrypt('$ENCODED_STRING') }
```  


## <a id="$utils.base64"></a>$utils.base64  
`Utility function`  
AES encrypt/decrypt a string  

Example:  

```yaml
  - echo: ${ $utils.aes.encrypt('hello world') }

  - echo: ${ $utils.aes.decrypt('$ENCRYPTED_STRING') }
```  


## <a id="$utils.debounceManager"></a>$utils.debounceManager  
`Utility function`  
Return using map debounce function via fn-debounce  

Example:  

```yaml
- fn-debounce:
    name: testDebounce
    wait: 5s
  runs:
    - echo: Hello
- js: |
    const count = $utils.debounceManager.size()
    const hasDebounce = $utils.debounceManager.has('testDebounce')
    $utils.debounceManager.get('testDebounce').flush()  


## <a id="$utils.format"></a>$utils.format  
`Utility function`  
Formater  

Example:  

```yaml
- echo: ${ $utils.format.fileName('a@(*&#à.jpg', ' ') }                             # => a a.jpg

- echo: ${ $utils.format.number(1000000) }                                          # => 1,000,000

- echo: ${ $utils.format.number(1000000) }                                          # => 1,000,000

- echo: ${ $utils.format.fixLengthNumber(1, 2) }                                    # => 001
- echo: ${ $utils.format.fixLengthNumber(10, 2) }                                   # => 010

- echo: ${ $utils.format.formatTextToMs('1d 1h 1m 1s 100') }                        # => 90061100

- echo: ${ $utils.format.formatTextToMs(new Date(), 'DD/MM/YYYY hh:mm:ss.ms') }     # => 01/12/2023 23:59:59.0

- echo: ${ $utils.format.yaml({name: 'yaml title'})}                                # => name: yaml title
```  


## <a id="$utils.globalEvent"></a>$utils.globalEvent  
`Utility function`  
Reference global event in application  

Example:  

```yaml
  - js: |
      $utils.globalEvent.on('say', (name) => {
        this.logger.info('Hello', name)
      })

  - js: |
      $utils.globalEvent.emit('say', 'Thanh 01')
```  


## <a id="$utils.md5"></a>$utils.md5  
`Utility function`  
Encrypt a string to md5  

Example:  

```yaml
  - echo: ${ $utils.md5.encrypt('hello world') }
```  


## <a id="$utils.parse"></a>$utils.parse  
`Utility function`  
Parser  

Example:  

```yaml
- name: parse string to yaml content text
  echo: ${ $utils.parse.yaml('title: "yaml title"') }       # => { "title": "yaml title" }

- name: parse string to Date object
  echo: ${ $utils.parse.date('2024/11/06 23:11:00.000', 'YYYY/MM/DD hh:mm:ss.ms') }  


## <a id="$utils.sleep"></a>$utils.sleep  
`Utility function`  
Sleep before do the next  

Example:  

```yaml
- js: |
    this.logger.info('Sleep 5s')
    await $utils.sleep('5s')
    this.logger.info('Do it')  


## <a id="$utils.styles"></a>$utils.styles  
`Utility function`  
Return [chalk](https://www.npmjs.com/package/chalk) which decorate text style (color, italic, bold, bgColor....)  

Example:  

```yaml
- js: |
    this.logger.debug($utils.styles.red('Red text'))
    this.logger.debug($utils.styles.blue.italic('Blue and italic text'))  


## <a id="$utils.throttleManager"></a>$utils.throttleManager  
`Utility function`  
Return using map throttle function via fn-throttle  

Example:  

```yaml
- fn-throttle:
    name: testThrottle
    wait: 5s
  runs:
    - echo: Hello
- js: |
    const count = $utils.throttleManager.size()
    const hasThrottle = $utils.throttleManager.has('testThrottle')
    $utils.throttleManager.get('testThrottle').flush()  


## <a id="$utils.url"></a>$utils.url  
`Utility function`  
URL encode/decode a string  

Example:  

```yaml
  - echo: ${ $utils.url.encode('hello world') }

  - echo: ${ $utils.url.decode('$ENCODED_STRING') }
```  

<br/>

### Have fun :)