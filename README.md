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
  r --tagDirs /myapp1 --tagDirs /myapp2 -- myapp.yaml     # "/myapp1", "/myapp2" are includes source code
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
title: Test scene
runs:
  - Hello world
```

2. Run
```sh
  r test.yaml
```


<br/>

# Common tags which is used in the program

| Tags | Description |
|---|---|
| [md'doc](#md'doc) | Generate comment in a file to document |
| [echo](#echo) | Print to console screen |
| [clear](#clear) | Clear console screen |
| [continue](#continue) | Ignore the next steps in the same parent |
| [exec](#exec) | Execute a program |
| [exec'js](#exec'js) | Execute a nodejs code |
| [exec'sh](#exec'sh) | Execute a shell script |
| [exit](#exit) | Stop then quit the program |
| [file'read](#file'read) | Read a file then load data into a variable |
| [file'store](#file'store) | Store data to file |
| [file'write](#file'write) | Write data to file |
| [group](#group) | Group elements |
| [http'del](#http'del) | Send a http request with DELETE method |
| [http'get](#http'get) | Send a http request with GET method |
| [http'head](#http'head) | Send a http request with HEAD method |
| [http'patch](#http'patch) | Send a http request with PATCH method |
| [http'post](#http'post) | Send a http request with POST method |
| [http'put](#http'put) | Send a http request with PUT method |
| [http/jobs](#http/jobs) | Create a jobs queue to do something step by step |
| [http/jobs'add](#http/jobs'add) | Add a job to the queue |
| [http/jobs'stop](#http/jobs'stop) | Stop the jobs queue |
| [input'confirm](#input'confirm) | Get user confirm (yes/no) |
| [input'multiselect](#input'multiselect) | Suggest a list of choices for user then allow pick multiple choices |
| [input'number](#input'number) | Get user input from keyboard then convert to number |
| [input'password](#input'password) | Get user input from keyboard but hide them then convert to text |
| [input'select](#input'select) | Suggest a list of choices for user then allow pick a choice |
| [input'suggest](#input'suggest) | Suggest a list of choices for user then allow pick a choice or create a new one |
| [input'text](#input'text) | Get user input from keyboard then convert to text |
| [npm'install](#npm'install) | Install librarries to use in the scene. |
| [npm'uninstall](#npm'uninstall) | Uninstall librarries to use in the scene. |
| [pause](#pause) | Pause the program then wait to user enter to continue |
| [scene](#scene) | Load another scene into the running program |
| [sleep](#sleep) | Sleep the program then wait to user enter to continue |
| [tag'register](#tag'register) | Register custom tags from code or npm module, github.... |
| [test](#test) | Check conditions in the program |
| [vars](#vars) | Declare and set value to variables to reused in the scene/global scope
- If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
- If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene |
| [view](#view) | View data in a pretty format |
| [view'json](#view'json) | View data in a json format |
| [view'table](#view'table) | View data in a table format |
| [view'yaml](#view'yaml) | View data in a yaml format |


## <a id="Root scene"></a>Root scene  
`It's a scene file`  
Root scene file includes all of steps to run  

Example:  

```yaml
  title: Scene name                 # Scene name
  description: Scene description    # Scene description
  log: info                         # Show log when run. Default is info. [silent, error, warn, info, debug, trace, all]
  password:                         # Encrypted this file with the password. To run this file, need to provides a password in the command line
  vars:                             # Declare global variables which are used in the program.
    env: production                 # |- Only the variables which are declared at here just can be overrided by environment variables
  runs:                             # Defined all of steps which will be run in the scene
    - echo: Hello world
    - test: test props
```  


## <a id="->"></a>->  
`It's a property in a tag`  
Expose item properties for others extends  

Example:  

```yaml
  - echo:                     # Not run
      ->: helloTemplate
      skip: true
      content: Hello

  - echo:                     # => Hi
      <-: helloTemplate
      content: Hi
```  


## <a id="<-"></a><-  
`It's a property in a tag`  
Copy properties from others (a item, or list items)  

Example:  

```yaml
  - http'get:
      skip: true
      ->: baseRequest
      baseURL: http://localhost
  - http'get:
      skip: true
      <-: baseRequest
      ->: user1Request
      headers:
        authorization: Bearer user1_token
  - http'get:
      skip: true
      ->: user2RequestWithoutBaseURL
      headers:
        authorization: Bearer user2_token

  - http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user1_token"
      <-: user1Request
      url: /posts
      vars: user1Posts

  - http'get:                      # Send a get request with baseURL is "http://localhost" and headers.authorization is "Bearer user2_token"
      <-:
        - baseRequest
        - user2RequestWithoutBaseURL
      url: /posts
      vars: user2Posts
```  


## <a id="async"></a>async  
`It's a property in a tag`  
Execute parallel tasks  

Example:  

```yaml
  - http'get:
      async: true
      url: /categories
      vars: categories
  - http'get:
      async: true
      url: /product/1
      vars: product

  - echo: The product ${product.name} is in the categories ${categories.map(c => c.name)}
```  


## <a id="force"></a>force  
`It's a property in a tag`  
Try to execute and ignore error in the running  

Example:  

```yaml
  - echo:                     # Not run
      force: true
      content: Got error "abc is not defined" but it should not stop here ${abc}

  - echo: Keep playing
```  


## <a id="if"></a>if  
`It's a property in a tag`  
Check condition before run the item  

Example:  

```yaml
  - vars:
      number: 11
  - echo:                               # => Value is greater than 10
      if: ${vars.number > 10}
      content: Value is greater than 10
  - echo:                               # No print
      if: ${vars.number < 10}
      content: Value is lessthan than 10
```  


## <a id="log"></a>log  
`It's a property in a tag`  
How to print log details for each of item.
Default is `info`
Value must be:
- `all`: Print all of log message
- `trace`: Print all of log message
- `debug`: Print short of log
- `info`: Print title, not show log details
- `warn`: Only show warning log
- `error`: Only show error log  

Example:  

```yaml
  - http'get:
      title: Get data from a API
      log: debug
      url: http://...../data.json
```  


## <a id="loop"></a>loop  
`It's a property in a tag`  
Loop to run items with a condition  

Example:  

Loop in array
```yaml
  - vars:
      arrs: [1,2,3,4]
  - echo:
      loop: ${vars.arrs}
      content: Index is ${this.loopKey}, value is ${this.loopValue}
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
  - echo:
      loop: ${vars.obj}
      content: Key is ${this.loopKey}, value is ${this.loopValue}
  # =>
  # Key is name, value is thanh
  # Key is sex, value is male
```

Dynamic loop in a condition
```yaml
  - vars:
      i: 0
  - echo:
      loop: ${vars.i < 3}
      content: value is ${vars.i++}
  # =>
  # value is 0
  # value is 1
  # value is 2
```

Loop in nested items
```yaml
  - vars:
      arrs: [1,2,3]
  - group:
      loop: ${vars.arrs}
      title: group ${this.loopValue}
      items:
        - echo: item value is ${this.parent.loopValue}
  # =>
  # group 1
  # item value is 1
```  


## <a id="skip"></a>skip  
`It's a property in a tag`  
Only init but not execute  

Example:  

```yaml
  - echo:                     # Not run
      ->: helloTemplate
      skip: true
      content: Hello

  - echo:                      # => Hi
      <-: helloTemplate
      content: Hi
```  


## <a id="title"></a>title  
`It's a property in a tag`  
Title  

Example:  

```yaml
  - sleep:
      title: Sleep in 1s
      duration: 1000
```  


## <a id="vars"></a>vars  
`It's a property in a tag`  
Set value in the item to global vars to reused later  

Example:  

```yaml
  - echo:
      content: Hello world
      vars: helloText
  - echo: ${vars.helloTexxt}
  # =>
  # Hello world
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
        - path: ${utils.curDir}/../INSTALLATION.md    # |- {path}: Read file content then copy it into document
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
  - echo: ${vars.name}
```

Quick print
```yaml
  - Hello world

  - vars:
      name: thanh
  - ${vars.name}
```

Print text with custom type. (Follow "chalk")
```yaml
  - echo'red: Color is red
  - echo'yellow: Color is yellow
  - echo'gray: Color is gray
  - echo'blue: Color is blue
  - echo'cyan: Color is cyan
  - echo'green: Color is green
  - echo'magenta: Color is magenta
  - echo: Color is white

  - echo:
      style: red
      content: Color is red
  - echo:
      style: red.bold
      content: Content is red and bold
```  


## <a id="clear"></a>clear  
  
Clear console screen  

Example:  

```yaml
  - clear:
```  


## <a id="continue"></a>continue  
  
Ignore the next steps in the same parent  

Example:  

```yaml
  - group:
      title: group 1
      runs:
        - echo: 1             # => 1
        - continue:           # => Stop here then ignore the next steps in the same parent
        - echo: 2
        - echo: 3
  - group:                    # Still run the next group
      title: group 1
      runs:
        - echo: 2             # => 2
```  


## <a id="exec"></a>exec  
  
Execute a program  

Example:  

Execute a bash script
```yaml
  - exec:
      title: Run a bash script
      commands:
        - /bin/sh
        - /startup.sh
```
Execute a python app
```yaml
  - exec:
      title: Run a python app
      commands:
        - python
        - app.py
```  


## <a id="exec'js"></a>exec'js  
  
Execute a nodejs code  

Example:  

Set value to a variable
```yaml
  - exec'js:
      title: Set value to a variable
      script: |
        vars.name = 'thanh'
        logger.info(vars.name)
```

Write a file
```yaml
  - exec'js:
      title: Write a file
      path: /sayHello.sh              # Path of js file (Use only "path" OR "script")
      script: |                       # NodeJS content
        const { writeFileSync } = require('fs')
        writeFileSync('/tmp/hello.txt', 'Hello world')
        return "OK"
      vars: result    # !optional
```  


## <a id="exec'sh"></a>exec'sh  
  
Execute a shell script  

Example:  

```yaml
  - exec'sh:
      title: Write a hello file
      path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
      script: |                       # Shell script content
        touch hello.txt
        echo "Hello world" > /tmp/hello.txt
      bin: /bin/sh    # !optional. Default use /bin/sh to run sh script
      vars: log       # !optional
```  


## <a id="exit"></a>exit  
  
Stop then quit the program  

Example:  

```yaml
  - exit:
```  


## <a id="file'read"></a>file'read  
  
Read a file then load data into a variable  

Example:  

Read a json file
```yaml
  - file'read:
      path: /tmp/data.json
      vars: fileData
      format: json  # !optional
```
Read a yaml file
```yaml
  - file'read:
      path: /tmp/data.yaml
      vars: fileData
      format: yaml  # !optional
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

  - exec'js: |
      const { fileDB } = vars
      fileDB.data.push('item 1')
      fileDB.data.push('item 2')
      // Save data to file
      fileDB.save()

  - echo: ${vars.fileDB.data}   # => ['item 1', 'item 2']
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
```
Write a yaml file
```yaml
  - file'write:
      path: /tmp/data.yaml
      content: ${vars.fileData}
      format: yaml  # !optional
```
Write a text file
```yaml
  - file'write:
      path: /tmp/data.txt
      content: Hello world
```  


## <a id="group"></a>group  
  
Group elements  

Example:  

```yaml
  - group:
      title: Print all of message
      runs:
        - echo: hello
        - echo: world
        - group:
            title: Stop
            runs:
              - exit:
```  


## <a id="http'del"></a>http'del  
  
Send a http request with DELETE method  

Example:  

```yaml
  # DELETE http://localhost:3000/posts/1?method=check_existed
  - http'del:
      title: Delete a post
      url: /posts/1
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        method: check_existed
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      vars:                           # !optional - Global variable which store value after executed
        status: ${this.response.status}
```  


## <a id="http'get"></a>http'get  
  
Send a http request with GET method  

Example:  

Get data from API then store value in `vars.posts`
```yaml
  # GET http://localhost:3000/posts?category=users
  - http'get:
      title: Get list posts
      url: /posts
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
      baseURL: http://localhost:3000  # !optional - Request base url
      query:                          # !optional - Request query string
        category: users
      headers:                        # !optional - Request headers
        authorization: Bearer TOKEN
      responseType: json              # !optional - Default is json ['json' | 'blob' | 'text' | 'buffer' | 'none']
      vars: posts                     # !optional - Global variable which store value after executed
```

Download file from a API
```yaml
  # GET http://localhost:3000/posts?category=users
  - http'get:
      title: Download a file
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
  - http'head:
      title: Check post is existed or not
      baseURL: http://localhost:
      timeout: 5000                   # !optional - Request timeout. Default is no timeout
                                      # supported: d h m s ~ day, hour, minute, seconds
                                      # example: 1h2m3s ~ 1 hour, 2 minutes, 3 seconds
      url: /posts/1
      query:
        method: check_existed
      headers:
        authorization: Bearer TOKEN
      vars:
        status: ${this.response?.status}
```  


## <a id="http'patch"></a>http'patch  
  
Send a http request with PATCH method  

Example:  

Update apart of data to API then store value in `vars.posts`
```yaml
  # PATCH http://localhost:3000/posts/ID?category=users
  - http'patch:
      title: Update a post
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
      vars: newPost
```
Upload file to server
```yaml
  # PATCH http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - http'patch:
      title: Upload and update data
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
        status: ${this.response.status}
```  


## <a id="http'post"></a>http'post  
  
Send a http request with POST method  

Example:  

Post data to API then store value in `vars.posts`
```yaml
  # POST http://localhost:3000/posts?category=users
  - http'post:
      title: Create a new post
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
  - http'post:
      title: Upload a new avatar
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
        status: ${this.response.status}
```  


## <a id="http'put"></a>http'put  
  
Send a http request with PUT method  

Example:  

Update data to API then store value in `vars.posts`
```yaml
  # PUT http://localhost:3000/posts/ID?category=users
  - http'put:
      title: Update a post
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
      vars: newPost
```
Upload file to server
```yaml
  # PUT http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
  - http'put:
      title: Upload and update data
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
        status: ${this.response.status}
```  


## <a id="http/jobs"></a>http/jobs  
  
Create a jobs queue to do something step by step  

Example:  

```yaml
  - file'store:                       # Defined a file store to save data to file
      path: /tmp/test.queue,
      initData: [],
      vars:
        fileStorage: '${this}'

  - http/jobs:
      address: 0.0.0.0:8811           # Address to listen to add a new job to
      queue:                          # Wait to finish a job before keep doing the next. If not set, it's will run ASAP when received requests
        concurrent: 1                 # Num of jobs can be run parallel
        storage: ${vars.fileStorage}  # Set a storage to queue
      runs:                           # Steps to do a job
        - ${parentState.jobData}      # {parentState.jobData} is job data in the queue which is included both querystring and request body
        - ${parentState.jobInfo}      # {parentState.jobInfo} is job information
                                      # {parentState.jobInfo.path} request path
                                      # {parentState.jobInfo.method} request method
                                      # {parentState.jobInfo.query} request query string
                                      # {parentState.jobInfo.headers} request headers
```  


## <a id="http/jobs'add"></a>http/jobs'add  
  
Add a job to the queue  

Example:  

Add a job by default
```yaml
  - http/jobs'add:
      address: 0.0.0.0:3007         # Address to listen to add a new job to queue
      data:                         # Steps to do a job
        name: name1
        age: 2
```

Use a "GET" http request to add a job
```yaml
  - http'get:
      url: http://0.0.0.0:3007?name=name1&age=2
```

Use a "POST" http request to add a job
```yaml
  - http'post:
      url: http://0.0.0.0:3007?name=name1
      body:
        age: 2
```  


## <a id="http/jobs'stop"></a>http/jobs'stop  
  
Stop the jobs queue  

Example:  

```yaml
  - http/jobs:
      address: 0.0.0.0:3007         # Address to listen to add a new job to
      runs:                         # Steps to do a job
        - echo: Display then stop
        - http/jobs'stop:           # Stop job here
```  


## <a id="input'confirm"></a>input'confirm  
  
Get user confirm (yes/no)  

Example:  

```yaml
# - input'conf:
  - input'confirm:
      title: Are you sure to delete it ?
      vars: userWantToDelete
      default: false  # !optional
      required: true  # !optional
```  


## <a id="input'multiselect"></a>input'multiselect  
  
Suggest a list of choices for user then allow pick multiple choices  

Example:  

```yaml
# - input'msel:
  - input'multiselect:
      title: Please select your hobbies ?
      vars: hobbies
      choices:
        - title: Tennis
          value: tn
        - title: Football
          value: fb
        - title: Basket ball
          value: bb
      default: [tn, fb]   # !optional
      required: true      # !optional
```  


## <a id="input'number"></a>input'number  
  
Get user input from keyboard then convert to number  

Example:  

```yaml
# - input'num:
  - input'number:
      title: Enter your age ?
      vars: age
      default: 18     # !optional
      required: true  # !optional
```  


## <a id="input'password"></a>input'password  
  
Get user input from keyboard but hide them then convert to text  

Example:  

```yaml
# - input'pwd:
  - input'password:
      title: Enter your password ?
      vars: password
      required: true  # !optional
```  


## <a id="input'select"></a>input'select  
  
Suggest a list of choices for user then allow pick a choice  

Example:  

```yaml
# - input'sel:
  - input'select:
      title: Your sex ?
      vars: sex
      choices:
        - title: male
          value: m
        - title: female
          value: f
      default: m      # !optional
      required: true  # !optional
```  


## <a id="input'suggest"></a>input'suggest  
  
Suggest a list of choices for user then allow pick a choice or create a new one  

Example:  

```yaml
# - input'sug:
  - input'suggest:
      title: Your hobby
      vars: hobby
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

```  


## <a id="input'text"></a>input'text  
  
Get user input from keyboard then convert to text  

Example:  

```yaml
# - input:
  - input'text:
      title: Enter your name
      vars: name
      default: Noname # !optional
      required: true  # !optional
```  


## <a id="npm'install"></a>npm'install  
  
Install librarries to use in the scene.  

Example:  

```yaml
  - npm'install: module1, module2

  - npm'install:
      - module1
      - myapp: git+ssh:git@github.com:...

  - npm'install:
      packages:
        - lodash
        - ymlr-telegram@latest     // Always get latest ymlr-telegram librarry

  # How to used
  - exec'js: |
      vars.newObject = require('lodash').merge({a: 2, b: 2}, {a: 1})
      require('myapp')

  - echo'pretty: ${vars.newObject}
```

Install from github
```yaml
  - npm'install:
      title: Install from github
      if: ${vars.useExternalPackage}
      packages:
        - myapp: git+ssh:git@github.com:...
        - ymlr...

  # How to used
  - myapp:
      title: This is my first application

```
  


## <a id="npm'uninstall"></a>npm'uninstall  
  
Uninstall librarries to use in the scene.  

Example:  

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


## <a id="pause"></a>pause  
  
Pause the program then wait to user enter to continue  

Example:  

```yaml
  - pause:

  - pause:
      title: Pause here
```  


## <a id="scene"></a>scene  
  
Load another scene into the running program  

Example:  

```yaml
  - scene:
      title: A scene from remote server
      path: https://.../another.yaml    # path can be URL or local path
      password:                         # password to decode when the file is encrypted
      vars:                             # Set value to global environment
        foo: bar
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
  - sleep:
      title: Sleep 10s
      duration 10000          # Sleep 10s then keep continue
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
          },
          disposeApp() {
            // Dispose when exit app
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
          disposeApp() {
            // Dispose when exit app
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
      check: ${vars.age > 10}

  - test: ${vars.age < 10}
```

Test with nodejs script
```yaml
  - test:
      title: Number must be greater than 10
      script: |
        if (vars.age > 10) this.failed('Age is not valid')
```  


## <a id="vars"></a>vars  
  
Declare and set value to variables to reused in the scene/global scope
- If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
- If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene  

Example:  

A main scene file
```yaml
  - vars:
      MainName: global var      # Is used in all of scenes
      mainName: local var       # Only used in this scene

  - scene:
      path: ./child.scene.yaml

  - echo: ${vars.MainName}      # => global var
  - echo: ${vars.mainName}      # => local var
  - echo: ${vars.name}          # => undefined
  - echo: ${vars.Name}          # => global name here
```
A scene file `child.scene.yaml` is:
```yaml
  - vars:
      Name: global name here
      name: scene name here     # Only used in this scene

  - echo: ${vars.MainName}      # => global var
  - echo: ${vars.mainName}      # => undefined
  - echo: ${vars.name}          # => scene name here
  - echo: ${vars.Name}          # => global name here
```  


## <a id="view"></a>view  
  
View data in a pretty format  

Example:  

```yaml
  - view:
      title: Pretty Viewer
      data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

  - view: ${vars.TEST_DATA}
```  


## <a id="view'json"></a>view'json  
  
View data in a json format  

Example:  

```yaml
  - view'json:
      title: JSON Viewer
      data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

  - view'json: ${vars.TEST_DATA}
```  


## <a id="view'table"></a>view'table  
  
View data in a table format  

Example:  

```yaml
  - view'table:
      title: Table viewer
      headers:            # Pick some headers to show. Default is all
        - name
        - age
      data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

  - view'table: ${vars.TEST_DATA}
```  


## <a id="view'yaml"></a>view'yaml  
  
View data in a yaml format  

Example:  

```yaml
  - view'yaml:
      title: Yaml Viewer
      data: [{ name: "name 2", age: 2 }, { name: "name 2", age: 3 }]

  - view'yaml: ${vars.TEST_DATA}
```  


<br/>

### Have fun :)