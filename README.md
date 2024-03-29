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
| [js](#js) | Execute a nodejs code |
| [npm'install](#npm'install) | Install librarries to use in the scene. |
| [npm'uninstall](#npm'uninstall) | Uninstall librarries to use in the scene. |
| [pause](#pause) | Pause the program then wait to user enter to continue |
| [runs](#runs) | Group elements |
| [scene](#scene) | Load another scene into the running program |
| [scene'process](#scene'process) | Same "scene" but it run as a child process |
| [scene'returns](#scene'returns) | Return value to parent scene |
| [sh](#sh) | Execute a shell script |
| [sleep](#sleep) | Sleep the program then wait to user enter to continue |
| [tag'register](#tag'register) | Register custom tags from code or npm module, github.... |
| [test](#test) | Check conditions in the program |
| [vars](#vars) | Declare and set value to variables to reused in the scene/global scope
- If the first character is uppercase, it's auto assigned to global which is used in the program (all of scenes)
- If the first character is NOT uppercase, it will be assigned to scene scope which is only used in the scene |


## <a id="Root scene"></a>Root scene  
`It's a scene file`  
Root scene file includes all of steps to run  

Example:  

```yaml
  name: Scene name                 # Scene name
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


## <a id="!regex"></a>!regex  
`It's a yaml type`  
Regex type  

Example:  

```yaml
  - vars:
      myRegex: !regex /\d+/g        # ${ $vars.myRegex } is a RegExp type
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
  - async: true
    http'get:
      url: /product/1
    vars: product

  - name: The product ${$vars.product.name} is in the categories ${$vars.categories.map(c => c.name)}
```  


## <a id="debug"></a>debug  
`It's a property in a tag`  
How to print log details for each of item.
Default is `info`
Value must be in:
- `all`: Print all of debug message
- `trace`: Print all of debug message
- `debug`: Print short of debug
- `info`: Print name, description without log details
- `warn`: Only show warning debug
- `error`: Only show error debug  

Example:  

```yaml
  - name: Get data from a API
    debug: debug
    http'get:
      url: http://...../data.json
```  


## <a id="force"></a>force  
`It's a property in a tag`  
Try to execute and ignore error in the running  

Example:  

```yaml
  - force: true
    name: Got error "abc is not defined" but it should not stop here ${abc}

  - name: Keep playing
```  


## <a id="id"></a>id  
`It's a property in a tag`  
ID Reference to element object in the $vars  

Example:  

```yaml
  - id: echo1
    skip: true
    echo: Hello               # Not run

  - exec'js: |
      this.logger.debug($vars.echo1.content)

```  


## <a id="if"></a>if  
`It's a property in a tag`  
Check condition before run the item  

Example:  

```yaml
  - vars:
      number: 11
  - if: ${$vars.number > 10}
    echo: Value is greater than 10      # => Value is greater than 10

  - if: ${$vars.number < 10}
    echo: Value is lessthan than 10     # No print
```  


## <a id="loop"></a>loop  
`It's a property in a tag`  
Loop to run items with a condition  

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
      - echo: item value is ${this.parent.loopValue}
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


## <a id="postScript"></a>postScript  
`It's a property in a tag`  
Execute a script before run  

Example:  

```yaml
  - echo: Execute here                           # => Execute here
    postScript: |                                # => Do something after executed
      console.log('Do something after executed')

```  


## <a id="preScript"></a>preScript  
`It's a property in a tag`  
Execute a script before run  

Example:  

```yaml
  - preScript: |                                # => Prepare data
      console.log('Prepare data')               # => Execute here
    echo: Execute here
```  


## <a id="skip"></a>skip  
`It's a property in a tag`  
Only init but not execute  

Example:  

```yaml
  - ->: helloTemplate
    skip: true
    echo: Hello                # Not run

  - <-: helloTemplate
    echo: Hi                   # => Hi
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
Set value in the item to global vars to reused later  

Example:  

```yaml
  - echo: Hello world
    vars: helloText
  - echo: ${$vars.helloText}     # => Hello world
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
        - path: ${$utils.curDir}/../INSTALLATION.md    # |- {path}: Read file content then copy it into document
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
  - name: group 1
    runs:
      - echo: 1             # => 1
      - continue:           # => Stop here then ignore the next steps in the same parent
      - echo: 2
      - echo: 3
  - name: group 1
    runs:                    # Still run the next group
      - echo: 2             # => 2
```  


## <a id="exec"></a>exec  
  
Execute a program  

Example:  

Execute a bash script
```yaml
  - name: Run a bash script
    exec:
      - /bin/sh
      - /startup.sh
```
Execute a python app
```yaml
  - exec:
      - python
      - app.py
```  


## <a id="exec'js"></a>exec'js  
  
Execute a nodejs code  

Example:  

Refers to "js" tag document  


## <a id="exec'sh"></a>exec'sh  
  
Execute a shell script  

Example:  

Refers to "sh" tag document  


## <a id="exit"></a>exit  
  
Stop then quit the program  

Example:  

```yaml
  - exit: 0

  - name: Throw error
    exit: 1
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
    vars:                             # !optional - Global variable which store value after executed
      status: ${this.response.status}
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
      status: ${this.response.status}
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
      status: ${this.response.status}
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
        storage: ${$vars.fileStorage}  # Set a storage to queue
      runs:                           # Steps to do a job
        - ${$parentState.jobData}      # {$parentState.jobData} is job data in the queue which is included both querystring and request body
        - ${$parentState.jobInfo}      # {$parentState.jobInfo} is job information
                                      # {$parentState.jobInfo.path} request path
                                      # {$parentState.jobInfo.method} request method
                                      # {$parentState.jobInfo.query} request query string
                                      # {$parentState.jobInfo.headers} request headers
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
      password:                         # password to decode when the file is encrypted
      varsFiles: [.env1, .env2]         # Load env file to variable
      scope: local                      # Value in [local, share]. Default is local
                                        # - local: Don't pass parent scene variables
                                        # - share: Pass parent scene variables
                                        # Note: Global variables are always updated
      vars:                             # They will only overrides "vars" in the scene
        foo: scene bar                  # First is lowercase is vars in scenes
        Foo: Global bar                 # First is uppercase is global vars which is used in the program
```  


## <a id="scene'process"></a>scene'process  
  
Same "scene" but it run as a child process  

Example:  

```yaml
  - name: A scene run as a child process
    # scene'process: ./another.yaml     # path can be URL or local path
    scene'process:
      id: proc01                        # process id which is how in log
      name: Scene name
      path: https://.../another.yaml    # path can be URL or local path
      password:                         # password to decode when the file is encrypted
      scope: local                      # Value in [local, share]. Default is local
                                        # - Global vars is always share, but scene vars is
                                        #   - local: Variables in the scene only apply in the scene
                                        #   - share: Variabes in the scene will be updated to all of scene
      vars:                             # They will only overrides "vars" in the scene
        foo: scene bar                  # First is lowercase is vars in scenes
        Foo: Global bar                 # First is uppercase is global vars which is used in the program
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


## <a id="sh"></a>sh  
  
Execute a shell script  

Example:  

Execute a sh file
```yaml
  - name: Write a hello file
    sh:
      path: /sayHello.sh              # Path of sh file (Use only "path" OR "script")
    vars: log       # !optional
```

Execute a bash script
```yaml
  - name: Write a hello file
    sh:
      script: |                       # Shell script content
        touch hello.txt
        echo "Hello world" > /tmp/hello.txt
      bin: /bin/sh                    # !optional. Default use /bin/sh to run sh script
      timeout: 10m                    # Time to run before force quit
      process: true                   # Create a new child process to execute it. Default is false
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

  - test: ${$vars.age < 10}
```

Test with nodejs script
```yaml
  - test:
      title: Number must be greater than 10
      script: |
        if (vars.age > 10) this.$.failed('Age is not valid')
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



## <a id="$utils.base64"></a>$utils.base64  
`Utility function`  
Base64 encrypt/decrypt a string  

Example:  

```yaml
  - echo: ${ $utils.base64.encrypt('hello world') }

  - echo: ${ $utils.base64.decrypt('$ENCRYPTED_STRING') }
```  


## <a id="$utils.base64"></a>$utils.base64  
`Utility function`  
AES encrypt/decrypt a string  

Example:  

```yaml
  - echo: ${ $utils.aes.encrypt('hello world') }

  - echo: ${ $utils.aes.decrypt('$ENCRYPTED_STRING') }
```  


## <a id="$utils.format"></a>$utils.format  
`Utility function`  
Formater  

Example:  

```yaml
  # Format file name
  - echo: ${ $utils.format.fileName('a@(*&#.jpg') }

  - echo: ${ $utils.format.number(1000000) }
```  


## <a id="$utils.md5"></a>$utils.md5  
`Utility function`  
Encrypt a string to md5  

Example:  

```yaml
  - echo: ${ $utils.md5.encrypt('hello world') }
```  

<br/>

### Have fun :)